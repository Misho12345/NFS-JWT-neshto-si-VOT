const KEYCLOAK_TOKEN_ENDPOINT = "http://localhost:8080/realms/file-manager/protocol/openid-connect/token";
const KEYCLOAK_CLIENT_ID = "file-manager-client";
const API_BASE_URL = "http://localhost:5000";

let accessToken = null;

const loginScreen = document.getElementById("login-screen");
const fileManagerScreen = document.getElementById("file-manager-screen");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const loginMessage = document.getElementById("login-message");

const logoutBtn = document.getElementById("logout-btn");

const listFilesBtn = document.getElementById("list-files-btn");
const fileList = document.getElementById("file-list");

const uploadInput = document.getElementById("upload-input");
const uploadBtn = document.getElementById("upload-btn");
const uploadStatus = document.getElementById("upload-status");

const editFilenameInput = document.getElementById("edit-filename");
const editContentInput = document.getElementById("edit-content");
const editBtn = document.getElementById("edit-btn");
const editMessage = document.getElementById("edit-message");

const deleteFilenameInput = document.getElementById("delete-filename");
const deleteBtn = document.getElementById("delete-btn");
const deleteMessage = document.getElementById("delete-message");

const downloadFilenameInput = document.getElementById("download-filename");
const downloadBtn = document.getElementById("download-btn");
const downloadMessage = document.getElementById("download-message");

function setTokenCookie(token, expiresIn) {
    const date = new Date();
    date.setTime(date.getTime() + (expiresIn * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `jwt_token=${token};${expires};path=/;SameSite=Strict`;
}

function getTokenFromCookie() {
    const name = "jwt_token=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');

    for (let cookie of cookieArray) {
        cookie = cookie.trim();
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return null;
}

function clearTokenCookie() {
    document.cookie = "jwt_token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (error) {
        return null;
    }
}

function isTokenValid(token) {
    if (!token) return false;

    const parsedToken = parseJwt(token);
    if (!parsedToken) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    return parsedToken.exp > currentTime;
}

async function attemptAutoLogin() {
    const savedToken = getTokenFromCookie();

    if (savedToken && isTokenValid(savedToken)) {
        accessToken = savedToken;
        showFileManagerScreen();
        return true;
    }

    clearTokenCookie();
    return false;
}

function showLoginScreen() {
    loginScreen.classList.add("active");
    fileManagerScreen.classList.remove("active");
}

function showFileManagerScreen() {
    loginScreen.classList.remove("active");
    fileManagerScreen.classList.add("active");
}

function setMessage(element, msg, isError = false) {
    clearMessages();
    element.textContent = msg;
    element.style.color = isError ? "red" : "green";

    setTimeout(() => {
        element.textContent = "";
    }, 5000);
}

function clearMessages() {
    document.querySelectorAll(".message").forEach((element) => {
        element.textContent = "";
    });
}


async function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        setMessage(loginMessage, "Username and password are required.", true);
        return;
    }

    try {
        const body = new URLSearchParams();
        body.append("client_id", KEYCLOAK_CLIENT_ID);
        body.append("grant_type", "password");
        body.append("username", username);
        body.append("password", password);

        const response = await fetch(KEYCLOAK_TOKEN_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: body.toString()
        });

        if (!response.ok) {
            throw new Error("Login failed. Check credentials or Keycloak client settings.");
        }

        const data = await response.json();
        if (data.access_token) {
            accessToaken = data.access_token;
            setTokenCookie(data.access_token, data.expires_in);
            showFileManagerScreen();
            clearFormData();
            setMessage(loginMessage, "");
        } else {
            throw new Error("No access_token returned from Keycloak.");
        }
    } catch (error) {
        setMessage(loginMessage, error.message, true);
        console.error(error);
    }
}

function handleLogout() {
    accessToken = null;
    clearTokenCookie();
    showLoginScreen();
    clearFormData();
}


function clearFormData() {
    usernameInput.value = "";
    passwordInput.value = "";
    uploadInput.value = "";
    editFilenameInput.value = "";
    editContentInput.value = "";
    deleteFilenameInput.value = "";
    uploadStatus.textContent = "";
    editMessage.textContent = "";
    deleteMessage.textContent = "";
}

async function listFiles() {
    fileList.innerHTML = "";

    try {
        const response = await fetch(`${API_BASE_URL}/files`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to list files");
        }

        const files = await response.json();
        if (files && Array.isArray(files)) {
            files.forEach((filename) => {
                const li = document.createElement("li");
                li.textContent = filename;
                fileList.appendChild(li);
            });
        } else {
            fileList.innerHTML = "<li>No files found.</li>";
        }
    } catch (error) {
        console.error(error);
        fileList.innerHTML = `<li>Error: ${error.message}</li>`;
    }
}

async function uploadFile() {
    const file = uploadInput.files[0];
    if (!file) {
        setMessage(uploadStatus, "Please select a file to upload.", true);
        return;
    }

    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE_URL}/file/upload`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error("Upload failed.");
        }

        const data = await response.json();
        setMessage(uploadStatus, data.message, false);
    } catch (error) {
        setMessage(uploadStatus, error.message, true);
        console.error(error);
    }
}

async function editFile() {
    const filename = editFilenameInput.value.trim();
    const newContent = editContentInput.value;

    if (!filename) {
        setMessage(editMessage, "Filename is required.", true);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/file/${filename}`, {
            method: "PUT",
            headers: {
                "Content-Type": "text/plain",
                Authorization: `Bearer ${accessToken}`
            },
            body: newContent
        });

        if (!response.ok) {
            throw new Error("Failed to edit file. Maybe file doesn't exist?");
        }

        const data = await response.json();
        setMessage(editMessage, data.message, false);
    } catch (error) {
        setMessage(editMessage, error.message, true);
        console.error(error);
    }
}

async function deleteFile() {
    const filename = deleteFilenameInput.value.trim();
    if (!filename) {
        setMessage(deleteMessage, "Filename is required.", true);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/delete/${filename}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to delete file. Maybe file doesn't exist?");
        }

        const data = await response.json();
        setMessage(deleteMessage, data.message, false);
    } catch (error) {
        setMessage(deleteMessage, error.message, true);
        console.error(error);
    }
}

async function downloadFile() {
    const filename = downloadFilenameInput.value.trim();
    if (!filename) {
        setMessage(downloadMessage, "Filename is required.", true);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/download/${filename}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error("File download failed. File may not exist.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);

        setMessage(downloadMessage, `File '${filename}' downloaded successfully.`);
    } catch (error) {
        setMessage(downloadMessage, error.message, true);
        console.error(error);
    }
}

loginBtn.addEventListener("click", handleLogin);
logoutBtn.addEventListener("click", handleLogout);

listFilesBtn.addEventListener("click", listFiles);
uploadBtn.addEventListener("click", uploadFile);
editBtn.addEventListener("click", editFile);
deleteBtn.addEventListener("click", deleteFile);
downloadBtn.addEventListener("click", downloadFile);

document.addEventListener("DOMContentLoaded", async () => {
    const autoLoginSuccessful = await attemptAutoLogin();
    if (!autoLoginSuccessful) {
        showLoginScreen();
    }
});
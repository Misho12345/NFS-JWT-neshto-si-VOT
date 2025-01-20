import os
from flask import Blueprint, request, jsonify, send_from_directory, abort
from werkzeug.utils import secure_filename
from .auth import token_required

file_bp = Blueprint("file_routes", __name__)

NFS_PATH = "/app/nfs"

os.makedirs(NFS_PATH, exist_ok=True)


@file_bp.route("/files", methods=["GET"])
@token_required
def list_files():
    files = os.listdir(NFS_PATH)
    return jsonify(files), 200


@file_bp.route("/file/upload", methods=["POST"])
@token_required
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(NFS_PATH, filename)
    file.save(filepath)

    return jsonify({"message": f"File '{filename}' uploaded successfully."}), 201


@file_bp.route("/download/<filename>", methods=["GET"])
@token_required
def download_file(filename):
    try:
        return send_from_directory(NFS_PATH, filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404


@file_bp.route("/file/<filename>", methods=["GET"])
@token_required
def get_file_content(filename):
    filepath = os.path.join(NFS_PATH, filename)
    if not os.path.isfile(filepath):
        return jsonify({"error": "File not found"}), 404

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    return jsonify({"filename": filename, "content": content}), 200


@file_bp.route("/file/<filename>", methods=["PUT"])
@token_required
def update_file(filename):
    filepath = os.path.join(NFS_PATH, filename)
    if not os.path.isfile(filepath):
        return jsonify({"error": "File not found"}), 404

    new_content = request.get_data(as_text=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)

    return jsonify({"message": f"File '{filename}' updated successfully."}), 200


@file_bp.route("/delete/<filename>", methods=["DELETE"])
@token_required
def delete_file(filename):
    filepath = os.path.join(NFS_PATH, filename)
    if not os.path.isfile(filepath):
        return jsonify({"error": "File not found"}), 404

    os.remove(filepath)
    return jsonify({"message": f"File '{filename}' deleted successfully."}), 200

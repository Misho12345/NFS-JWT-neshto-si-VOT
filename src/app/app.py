import os
from flask import Flask, render_template
from dotenv import load_dotenv
from flask_cors import CORS

from .routes import file_bp

load_dotenv()


def create_app():
    app = Flask(__name__, static_folder="../static", template_folder="../templates")
    CORS(app)

    app.register_blueprint(file_bp)

    @app.route("/")
    def index():
        return render_template("index.html")

    return app


def main():
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)


if __name__ == "__main__":
    main()

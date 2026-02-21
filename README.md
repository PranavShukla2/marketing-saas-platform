# ArbFlow. — Marketing Agency Analytics SaaS

ArbFlow is a professional multi-tenant infrastructure designed for marketing agencies to centralize and secure their clients' Google Analytics 4 (GA4) data. Built with a modern tech stack focusing on security, performance, and scalability.

## 🚀 Key Features
* **Multi-Tenant Architecture**: Complete data isolation using a secure FastAPI backend and SQLAlchemy.
* **AES-256 Encryption**: Client service account keys are encrypted at rest using the Fernet (cryptography) library before being stored in the database.
* **Stateless JWT Auth**: Secure authentication flow using JSON Web Tokens for session management.
* **Live GA4 Extraction**: Real-time data fetching from the Google Analytics 4 Data API using Python.
* **Modern UI/UX**: Responsive dashboard built with Next.js, Tailwind CSS, and Framer Motion for smooth animations.

## 🛠️ Tech Stack
| Category | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14, React, Tailwind CSS, Framer Motion, Recharts |
| **Backend** | FastAPI (Python 3.12), SQLAlchemy, Pydantic |
| **Database** | SQLite (Development) / PostgreSQL (Production) |
| **Security** | JWT, AES-256 Encryption (Fernet), Bcrypt Password Hashing |
| **Integrations** | Google Analytics 4 Data API |

## 🏗️ Project Architecture


The application separates concerns into three distinct layers:
1. **Frontend**: Handles the interactive dashboard and secure credential entry.
2. **Security Vault**: Encrypts sensitive JSON keys before they hit the database.
3. **Extraction Engine**: Decrypts keys just-in-time to authenticate with Google's servers.

## 🏁 Getting Started

### 1. Clone the repository
```bash
git clone [https://github.com/your-username/marketing-saas-platform.git](https://github.com/your-username/marketing-saas-platform.git)
cd marketing-saas-platform
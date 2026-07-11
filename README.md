 ## Cloud Cost Guardian AI

Cloud Cost Guardian AI is an intelligent, autonomous dashboard designed to give you total visibility and control over your AWS financial surveillance. By leveraging predictive models and continuous learning, the Guardian acts as a financial watchdog—tracking baseline costs, exposing hidden spikes, forecasting future overheads, and offering actionable insights all within a sleek, low-latency interface.

---

##  Features

*   **Cost Tracking**: Monitor your real-time and historical cloud spend through visually responsive Area Charts with smooth gradient scaling.
*   **Anomaly Detection**: Automatically filter operations scanning for hidden deviations within your architectural cost mapping. Critical spikes are flagged recursively.
*   **Prediction AI**: Utilizes regression mechanisms to build robust forecasted models over 7-day windows, keeping budget management proactive.
*   **Explanation AI**: Not only will the AI spot the problem—it will parse out the *Root Cause* and offer a *Recommended Action* for infrastructure remediation.
*   **SaaS Dashboard**: A premium, fully responsive React interface featuring an integrated Dark Mode and smooth local state persistence.

##  Technology Stack

**Frontend**
*   **React** & **Vite**
*   **Tailwind CSS** (Styling, Gradients & Dark Mode support)
*   **Recharts** (SVG based Data Visualization)
*   **Lucide React** (Clean, native iconography)

**Backend**
*   **FastAPI** (High-performance asynchronous Python API)
*   **MongoDB** (Data storage and persistent model training records via PyMongo)
*   **Uvicorn** (Lightning-fast ASGI server)

---

## Architecture Overview

The application features a loosely coupled architecture:
1.  **React Frontend:** Connects safely to the Backend via standard `fetch` API wrappers with built-in retry polling. React relies completely on data orchestration pushed up from the Python server.
2.  **FastAPI Backend:** Orchestrates all complex logic, acting as the bridge to AWS data proxies (mocked or live connections). 
3.  **MongoDB Storage:** The backend seamlessly syncs and retrieves document structures, acting securely as a high-read state machine. Contains built-in fallback triggers to populate default data if network connection fails.

---

## Setup Steps

### Prerequisites
*   Node.js (`v18+`)
*   Python (`3.9+`)
*   MongoDB Instance (Local OR Atlas)

### 1. Database & Backend Configuration
Navigate to the root directory and set up your Python environment:

```bash
# Create and activate a Virtual Environment
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install Backend Dependencies
pip install -r requirements.txt

# Start the FastAPI Server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend Configuration
Open a new terminal window and navigate to the `frontend` folder:

```bash
cd frontend

# Install Frontend Dependencies
npm install

# Start the Vite Development Server
npm run dev
```

##  Future Improvements

- [ ] **AWS Cost Explorer API Integration**: Replace the algorithmic generation mock routes with direct AWS authenticated Boto3 endpoints.
- [ ] **Push Alerts**: Direct integration with Slack/Discord webhooks to autonomously ping engineering teams on detection thresholds.
- [ ] **Authentication Layer**: Introduce standard OAuth2 / JWT authentication to secure the frontend portal.
- [ ] **PDF Reporting**: Add weekly PDF summary reporting outputs via cron jobs.

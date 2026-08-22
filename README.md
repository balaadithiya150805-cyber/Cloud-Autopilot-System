# Cloud Autopilot System

## AI-Powered Cloud Cost Monitoring, Anomaly Detection, Forecasting and Recommendation Platform

Cloud Autopilot System is a full-stack cloud cost intelligence platform designed to help users monitor cloud expenditure, identify abnormal spending patterns, forecast future costs, and understand potential causes of unexpected cost changes.

The platform combines a modern React-based web interface with a FastAPI backend, MongoDB persistence, authentication services, analytical processing, anomaly detection, cost forecasting, and recommendation capabilities. It is deployed using a cloud-based architecture with Netlify for the frontend, Render for the backend, and MongoDB Atlas for persistent data storage.

The primary objective of the project is to move cloud cost management beyond simple expense visualization by providing analytical insights that help users understand historical spending and make more informed decisions about future cloud expenditure.

## Live Application

Live Demo:

https://tinyurl.com/pilotaws

Source Code:

https://github.com/balaadithiya150805-cyber/Cloud-Autopilot-System

---

## Project Overview

Cloud infrastructure can generate rapidly changing costs due to resource utilization, configuration changes, unexpected workloads, scaling activities, and inefficient resource allocation.

Traditional cloud billing dashboards primarily focus on reporting existing expenditure. While these dashboards are useful for monitoring, they often require users to manually analyze historical patterns and identify unusual changes.

Cloud Autopilot System addresses this problem by combining cost visualization, statistical analysis, anomaly detection, forecasting, and recommendation mechanisms into a single application.

The platform provides a workflow in which cloud cost information is processed, analyzed, visualized, and converted into actionable insights.

The system focuses on four primary analytical capabilities:

1. Cost monitoring and visualization
2. Anomaly detection
3. Future cost prediction
4. Recommendation and explanation generation

These capabilities are supported by a secure authentication and account-management system.

---

# Core Features

## 1. Cloud Cost Monitoring

The dashboard provides users with a centralized interface for examining cloud expenditure.

The monitoring layer is designed to provide:

* Historical cost visualization
* Cost trend analysis
* Service-level cost information
* Cost summaries
* Interactive charts
* Historical spending comparison
* Dashboard-based cost monitoring

The visualization layer allows users to understand how expenditure changes over time rather than relying exclusively on raw billing records.

---

## 2. Anomaly Detection

Cloud Autopilot includes an anomaly detection service for identifying unusual changes in cloud expenditure.

The system analyzes historical cost information and identifies observations that significantly deviate from the expected spending pattern.

Potential anomalies can represent situations such as:

* Unexpected increases in cloud expenditure
* Abnormal service consumption
* Sudden changes in resource usage
* Unusual billing patterns
* Potential cloud resource inefficiencies

Detected anomalies are surfaced through the application dashboard so that users can investigate the underlying cost behavior.

---

## 3. Cost Forecasting

The platform includes a cost prediction service that estimates upcoming expenditure using historical cost information.

The current implementation provides short-term forecasting capabilities, including seven-day cost predictions.


The purpose of forecasting is to provide early visibility into potential cost increases and help users monitor spending before projected expenditure becomes a larger issue.

---

## 4. Cost Explanation and Recommendations

Identifying an anomaly is only one part of effective cloud cost management.

Cloud Autopilot includes a recommendation layer designed to translate detected cost behavior into understandable guidance.

The system can provide recommendations related to areas such as:

* Investigating unexpected cost increases
* Reviewing resource utilization
* Examining abnormal service consumption
* Monitoring recurring spending patterns
* Evaluating potential sources of cloud waste

The recommendation system is intended to help users move from identifying a problem to understanding possible actions.

# Authentication and Account Management

Cloud Autopilot contains a complete authentication workflow for protecting user-specific application data.

The authentication system includes:

* User registration
* Email verification using OTP
* Secure password hashing
* JWT-based authentication
* Login
* Logout
* Protected application access
* Password reset
* Forgot-password workflow
* Account settings
* Password validation

The password policy currently requires passwords to contain between 8 and 16 characters.

The authentication architecture separates authentication logic from application services, allowing the system to maintain a modular backend structure.

---

# Email Verification

New accounts use an OTP-based verification mechanism.

The registration workflow is:

```text
User Registration
       |
       v
Generate OTP
       |
       v
Store OTP and Expiration
       |
       v
Send Verification Email
       |
       v
User Enters OTP
       |
       v
Verify OTP
       |
       v
Activate Account
```

The email service is designed to support cloud deployment and includes fallback handling when email delivery is temporarily unavailable.

OTP expiration and validation are handled by the backend.

---

# Password Recovery

The platform also provides an OTP-based password recovery mechanism.

The password recovery workflow is:

```text
Forgot Password
       |
       v
Enter Registered Email
       |
       v
Generate Reset OTP
       |
       v
Send Reset OTP
       |
       v
Verify Reset OTP
       |
       v
Create New Password
       |
       v
Update Account
       |
       v
Login
```

Password reset requests are validated by the backend before modifying stored authentication credentials.

---



## Frontend

| Technology   | Purpose                                 |
| ------------ | --------------------------------------- |
| React        | User interface development              |
| TypeScript   | Type-safe frontend development          |
| Vite         | Development and production build system |
| Tailwind CSS | Responsive interface styling            |
| Recharts     | Data visualization                      |
| Lucide React | Interface icons                         |

## Backend

| Technology       | Purpose                          |
| ---------------- | -------------------------------- |
| Python           | Backend development              |
| FastAPI          | REST API framework               |
| Uvicorn          | ASGI application server          |
| PyMongo          | MongoDB integration              |
| JWT              | Authentication and authorization |
| bcrypt / Passlib | Password hashing                 |

## Data and Analytics

| Technology / Method          | Purpose                    |
| ---------------------------- | -------------------------- |
| Python                       | Data processing            |
| Statistical analysis         | Cost pattern analysis      |
| Z-Score based analysis       | Anomaly detection          |
| Regression-based forecasting | Short-term cost prediction |
| Recommendation service       | Cost optimization guidance |

## Infrastructure

| Platform                | Purpose                      |
| ----------------------- | ---------------------------- |
| GitHub                  | Source code management       |
| Netlify                 | Frontend deployment          |
| Render                  | Backend deployment           |
| MongoDB Atlas           | Cloud database               |
| Resend / Email Provider | Transactional email delivery |

---



# API

The FastAPI backend provides REST endpoints for application functionality.

The backend also exposes interactive API documentation through FastAPI's OpenAPI interface.


# Author

## Bala Adithiya

Computer Science Engineering student focused on cloud engineering, full-stack development, Python development, artificial intelligence, machine learning, and building practical software systems.

GitHub:

https://github.com/balaadithiya150805-cyber

---

## License

This project is developed for educational, portfolio, research, and demonstration purposes.

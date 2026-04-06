# 🌾 AgriAI – AI-Powered Contract Farming Platform

AgriAI is an AI-powered contract farming platform that digitally connects farmers and buyers through a secure and transparent system. The platform enables farmers to upload crop details and buyers to post procurement deals, allowing both parties to search, negotiate, and finalize contracts through mutual agreement.

## ⚠️ Note on Source Code

> 🔒 **Disclaimer:** he full implementation of some parts of the project, including advanced recommendation features, payment gateway integration, or proprietary logic, has been intentionally omitted from the public repository to protect sensitive code and data.

## 👥 User Roles

- Farmer
- Buyer
Each user role has secure authentication and role-based access.

## 🧹 Data Handling & Processing

- Structured data storage using MySQL
- Separate tables for users, crops, deals, carts, and contracts
- Secure CRUD operations through Flask APIs
- Input validation and role-based access control

## 🚀 Key Features

- 🔐 Farmer & Buyer Authentication – Secure login and registration
- 🌱 Crop Upload – Farmers can list crops with price, quantity, and availability
- 📄 Deal Posting – Buyers can upload purchase requirements
- 🔎 Two-Way Search – Farmers can search buyers and buyers can search farmers
- 🛒 Cart-Based Workflow – Crops or deals added to cart for contract initiation
- 📝 Digital Contract System – Contracts generated after mutual approval
- 🤖 AI Chatbot – Answers farming-related queries and platform guidance
- 🌐 Multilingual Support – English, Hindi, and Kannada

## 🚫 Deployment Status

- Project is currently not deployed online
- Can be executed locally using Flask backend and web-based frontend

## 🎯 Impact

- Enables direct farmer-to-buyer interaction
- Reduces dependency on intermediaries
- Promotes transparent and secure contract farming
- Demonstrates real-world integration of AI, web technologies, and databases
- Strong showcase of AgriTech-focused full stack development

---

## 📂 Project Structure

```
📁 AgriAI
│
├── backend/                 # Flask backend
│   ├── app.py               # Main Flask app
│   ├── create_tables.sql    # SQL scripts to create tables
│   ├── .env                 # Environment variables
│   ├── routes/              # API route files
│   ├── utils/               # Helper functions, validations
│
├── src/                     # React.js frontend
│   ├── components/          # Reusable components
│   ├── farmer/              # Farmer-specific pages
│   ├── buyer/               # Buyer-specific pages
│   ├── Cart.js
│   ├── Navbar.js
│   └── i18n.js              # Multilingual support
│
├── README.md                # Project documentation
└── package.json             # Frontend dependencies


```

---

## ⚙️ Installation & Running Locally

### 🔹 Prerequisites

- **Python 3.8+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 16+** - [Download Node.js](https://nodejs.org/)
- **MySQL 8.0+** - [Download MySQL](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download Git](https://git-scm.com/)

### 🔹 1. Clone the repository

```bash
git clone https://github.com/Ujjal57/AgriAI.git
cd AgriAI
```

### 🔹 2. Backend Setup (Python/Flask)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env file with your database credentials:
# DB_HOST=localhost
# DB_USER=your_mysql_username
# DB_PASSWORD=your_mysql_password
# DB_NAME=agri_ai
# DB_PORT=3306

# Initialize database tables
python init_database.py
```

### 🔹 3. Database Setup (MySQL)

```sql
-- Create database
CREATE DATABASE agri_ai;

-- The application will automatically create required tables
-- when you run init_database.py
```

### 🔹 4. Frontend Setup (React)

```bash
# Return to root directory
cd ..

# Install Node.js dependencies
npm install

# Start the React development server
npm start
```

### 🔹 5. Run the Application

**Terminal 1: Start Backend Server**
```bash
cd backend
python app.py
```
- Backend API will run on: http://localhost:5000

**Terminal 2: Start Frontend Server**
```bash
npm start
```
- Frontend will run on: http://localhost:3000

### 🔹 6. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

### 🔹 Troubleshooting

- **Port conflicts:** If ports 3000 or 5000 are busy, React/Flask will prompt for alternative ports
- **Database connection:** Ensure MySQL is running and credentials in `.env` are correct
- **Python virtual environment:** Always activate the virtual environment before running backend commands
- **Dependencies:** If you encounter import errors, ensure all packages from `requirements.txt` are installed

### 🔹 Optional Features

To enable additional features, uncomment the relevant packages in `backend/requirements.txt`:

- **AI/ML Features:** Uncomment groq, mediapipe, scikit-learn, opencv
- **Translation:** Uncomment deep-translator, langdetect, gTTS
- **Admin Dashboard:** Uncomment streamlit
- **PDF Processing:** Uncomment PyMuPDF
- **Document Processing:** Uncomment python-docx
```

### 🔹 4. Frontend setup

- Navigate to src/ and install dependencies:

```npm install
npm start
```
- React app runs on http://localhost:3000


### 🔹 4. Run backend

```python backend/app.py
```

- Flask API runs on http://localhost:5000
    
---

## 🖼️ Screenshots
<p align="center">
  <em>Home Page</em><br>
  <img src="images/home.png" alt="Home Page" width="700"/>
</p>

<p align="center">
  <em>Sign In/Sign Up</em><br>
  <img src="images/sign.png" alt="Sign In/Sign Up" width="700"/>
</p>

<p align="center">
  <em>Farmer Page</em><br>
  <img src="images/farmer.png" alt="Farmer Page" width="700"/>
</p>

<p align="center">
  <em>Buyer Page</em><br>
  <img src="images/buyer.png" alt="Buyert Page" width="700"/>
</p>

<p align="center">
  <em>Crops Page</em><br>
  <img src="images/crops.png" alt="Crops Page" width="700"/>
</p>

<p align="center">
  <em>Deals Page</em><br>
  <img src="images/deal.png" alt="Deals Page" width="700"/>
</p>

<p align="center">
  <em>Cart Page</em><br>
  <img src="images/cart.png" alt="Cart Page" width="700"/>
</p>

---

## 🔐 Sample Admin/Farmer/Buyer Access

- Credentials can be created through registration pages

---

## 👨‍💻 Developer

**Ujjal Kumar Dey** 

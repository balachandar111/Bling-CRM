// 📁 src/pages/Dashboard.jsx

import React,
{
  useEffect,
  useState,
} from "react";

import API from "../services/api";
import * as XLSX from "xlsx";

import {
  useNavigate,
} from "react-router-dom";
// ================= BULK UPLOAD =================

const handleFileUpload = async (e) => {

  const file = e.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = async (evt) => {

    const data = evt.target.result;

    const workbook = XLSX.read(data, {
      type: "binary",
    });

    const sheetName =
      workbook.SheetNames[0];

    const sheet =
      workbook.Sheets[sheetName];

    const customers =
      XLSX.utils.sheet_to_json(sheet);

    try {

      await API.post(
        "/customers/bulk-upload",
        {
          customers,
        }
      );

      alert(
        "Customers Uploaded Successfully"
      );

      fetchCustomers();

    } catch (error) {

      console.log(error);

      alert(
        error.response?.data?.message
      );
    }
  };

  reader.readAsBinaryString(file);
};

import {

  FaTachometerAlt,
  FaUsers,
  FaBell,
  FaChartLine,
  FaMoneyBillWave,
  FaUserCheck,
  FaTasks,
  FaPlus,
  FaTimes,
  FaSignOutAlt,
  FaUserCircle,

} from "react-icons/fa";

import {

  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,

} from "recharts";


const Dashboard = () => {

  const navigate =
    useNavigate();

  // ================= USER =================

  const user =
  JSON.parse(
    localStorage.getItem("user")
  );


  // ================= STATE =================

  const [customers, setCustomers] =
    useState([]);

  const [showModal, setShowModal] =
    useState(false);

  const [showProfile, setShowProfile] =
    useState(false);


  // ================= FORM =================

  const [formData, setFormData] =
    useState({

      name: "",
      email: "",
      phone: "",
      company: "",

      status: "lead",

      leadStage: "Awareness",

      investment: "",

      remark: "",

      followUpDate: "",

      priority: "Medium",

      source: "Website",

      assignedTo: "",
    });


  // ================= HANDLE CHANGE =================

  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]:
        e.target.value,
    });
  };


  // ================= LOGOUT =================

  const handleLogout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login");
  };


  // ================= FETCH CUSTOMERS =================

  const fetchCustomers = async () => {

    try {

      const { data } =
      await API.get(
        "/customers"
      );

      setCustomers(
        data.customers
      );

    } catch (error) {

      console.log(error);
    }
  };


  useEffect(() => {

    fetchCustomers();

  }, []);


  // ================= ADD CUSTOMER =================

  const addCustomer =
  async (e) => {

    e.preventDefault();

    try {

      await API.post(

        "/customers",

        formData
      );

      fetchCustomers();

      setShowModal(false);

      setFormData({

        name: "",
        email: "",
        phone: "",
        company: "",

        status: "lead",

        leadStage: "Awareness",

        investment: "",

        remark: "",

        followUpDate: "",

        priority: "Medium",

        source: "Website",

        assignedTo: "",
      });

      alert(
        "Customer Added Successfully"
      );

    } catch (error) {

      console.log(error);

      alert(
        error.response?.data?.message
      );
    }
  };


  // ================= ANALYTICS =================

  const totalCustomers =
    customers.length;

  const totalRevenue =
    customers.reduce(

      (acc, item) =>

        acc +
        Number(
          item.investment || 0
        ),

      0
    );

  const converted =
    customers.filter(

      (c) =>
        c.leadStage === "Closure"

    ).length;

  const activeLeads =
    customers.filter(

      (c) =>
        c.leadStage !== "Closure"

    ).length;


  // ================= CHART DATA =================

  const stageData = [

    {
      name: "Awareness",

      value:
        customers.filter(
          (c) =>
            c.leadStage ===
            "Awareness"
        ).length,
    },

    {
      name: "Interest",

      value:
        customers.filter(
          (c) =>
            c.leadStage ===
            "Interest"
        ).length,
    },

    {
      name: "Desire",

      value:
        customers.filter(
          (c) =>
            c.leadStage ===
            "Desire"
        ).length,
    },

    {
      name: "Closure",

      value:
        customers.filter(
          (c) =>
            c.leadStage ===
            "Closure"
        ).length,
    },
  ];


  const COLORS = [

    "#2563EB",
    "#7C3AED",
    "#F59E0B",
    "#10B981",
  ];


  return (

    <div className="layout">


      {/* SIDEBAR */}

      <div className="sidebar">

        <div className="logo">

          Bling CRM

        </div>


        <ul>

          <li className="active">

            <FaTachometerAlt />

            Dashboard

          </li>


          <li>

            <FaUsers />

            Employees

          </li>


          <li>

            <FaTasks />

            Activities

          </li>


          <li>

            <FaBell />

            Reminders

          </li>


          {/* PROFILE */}

          <li
            onClick={() =>
              setShowProfile(true)
            }
          >

            <FaUserCircle />

            Profile

          </li>

        </ul>


        {/* LOGOUT */}

        <button
          className="logout-btn"
          onClick={handleLogout}
        >

          <FaSignOutAlt />

          Logout

        </button>

      </div>


      {/* MAIN CONTENT */}

      <div className="main-content">


        {/* TOPBAR */}

        <div className="topbar">

          <div>

            <h1>
              CRM Analytics Dashboard
            </h1>

            <p>
              Sales & Customer Insights
            </p>

          </div>
<div className="action-buttons">

  {/* ADD CUSTOMER */}

  <button
    className="add-btn"
    onClick={() =>
      setShowModal(true)
    }
  >

    <FaPlus />

    Add Customer

  </button>


  {/* UPLOAD EXCEL */}

  <label className="upload-btn">

    Upload Excel

    <input
      type="file"
      accept=".xlsx,.xls,.csv"
      hidden
      onChange={handleFileUpload}
    />

  </label>

</div>

         

        </div>
        


        {/* KPI CARDS */}

        <div className="stats-grid">

          <div className="stat-card">

            <div>

              <h4>
                Total Leads
              </h4>

              <h2>
                {totalCustomers}
              </h2>

            </div>

            <FaUsers className="icon blue" />

          </div>


          <div className="stat-card">

            <div>

              <h4>
                Revenue
              </h4>

              <h2>
                ₹{totalRevenue}
              </h2>

            </div>

            <FaMoneyBillWave
              className="icon green"
            />

          </div>


          <div className="stat-card">

            <div>

              <h4>
                Converted
              </h4>

              <h2>
                {converted}
              </h2>

            </div>

            <FaUserCheck
              className="icon purple"
            />

          </div>


          <div className="stat-card">

            <div>

              <h4>
                Active Leads
              </h4>

              <h2>
                {activeLeads}
              </h2>

            </div>

            <FaChartLine
              className="icon orange"
            />

          </div>

        </div>


        {/* CHARTS */}

        <div className="charts-grid">


          {/* PIE */}

          <div className="chart-card">

            <h3>
              Sales Funnel
            </h3>


            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <PieChart>

                <Pie
                  data={stageData}
                  dataKey="value"
                  outerRadius={100}
                  label
                >

                  {stageData.map(
                    (entry, index) => (

                      <Cell
                        key={index}
                        fill={
                          COLORS[index]
                        }
                      />
                    )
                  )}

                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>

          </div>


          {/* BAR */}

          <div className="chart-card">

            <h3>
              Revenue Analytics
            </h3>


            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <BarChart
                data={customers}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="name"
                />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="investment"
                  fill="#2563EB"
                  radius={[
                    10,
                    10,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* LINE + AREA */}

        <div className="charts-grid">


          <div className="chart-card">

            <h3>
              Investment Growth
            </h3>


            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <LineChart
                data={customers}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="name"
                />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="investment"
                  stroke="#7C3AED"
                  strokeWidth={4}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>


          <div className="chart-card">

            <h3>
              Pipeline Activity
            </h3>


            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <AreaChart
                data={customers}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="name"
                />

                <YAxis />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="investment"
                  stroke="#10B981"
                  fill="#10B981"
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* TABLE */}

        <div className="table-card">

          <h2>
            Customer Records
          </h2>


          <table>

            <thead>

              <tr>

                <th>Name</th>

                <th>Company</th>

                <th>Phone</th>

                <th>Stage</th>

                <th>Revenue</th>

                <th>Priority</th>

              </tr>

            </thead>


            <tbody>

              {customers.map(
                (customer) => (

                  <tr
                    key={customer._id}
                  >

                    <td>
                      {customer.name}
                    </td>

                    <td>
                      {customer.company}
                    </td>

                    <td>
                      {customer.phone}
                    </td>

                    <td>

                      <span className="badge">

                        {
                          customer.leadStage
                        }

                      </span>

                    </td>

                    <td>
                      ₹
                      {
                        customer.investment
                      }
                    </td>

                    <td>
                      {
                        customer.priority
                      }
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ADD CUSTOMER MODAL */}

      {
        showModal && (

          <div className="modal-overlay">

            <div className="modal">

              <div className="modal-header">

                <h2>
                  Add Customer
                </h2>

                <FaTimes
                  className="close-icon"
                  onClick={() =>
                    setShowModal(false)
                  }
                />

              </div>


              <form
                onSubmit={addCustomer}
              >

                <div className="form-grid">

  {/* NAME */}

  <div className="input-group">

    <label>
      Customer Name
    </label>

    <input
      type="text"
      name="name"
      placeholder="Customer Name"
      value={formData.name}
      onChange={handleChange}
      required
    />

  </div>


  {/* EMAIL */}

  <div className="input-group">

    <label>
      Email Address
    </label>

    <input
      type="email"
      name="email"
      placeholder="Email"
      value={formData.email}
      onChange={handleChange}
    />

  </div>


  {/* PHONE */}

  <div className="input-group">

    <label>
      Phone Number
    </label>

    <input
      type="text"
      name="phone"
      placeholder="Phone"
      value={formData.phone}
      onChange={handleChange}
    />

  </div>


  {/* COMPANY */}

  <div className="input-group">

    <label>
      Company Name
    </label>

    <input
      type="text"
      name="company"
      placeholder="Company"
      value={formData.company}
      onChange={handleChange}
    />

  </div>


  {/* LEAD STAGE */}

  <div className="input-group">

    <label>
      Lead Stage
    </label>

    <select
      name="leadStage"
      value={formData.leadStage}
      onChange={handleChange}
    >

      <option>
        Awareness
      </option>

      <option>
        Interest
      </option>

      <option>
        Desire
      </option>

      <option>
        Closure
      </option>

    </select>

  </div>


  {/* INVESTMENT */}

  <div className="input-group">

    <label>
      Investment
    </label>

    <input
      type="number"
      name="investment"
      placeholder="Investment"
      value={formData.investment}
      onChange={handleChange}
    />

  </div>


  {/* PRIORITY */}

  <div className="input-group">

    <label>
      Priority
    </label>

    <select
      name="priority"
      value={formData.priority}
      onChange={handleChange}
    >

      <option>
        Low
      </option>

      <option>
        Medium
      </option>

      <option>
        High
      </option>

    </select>

  </div>


  {/* FOLLOWUP */}

  <div className="input-group">

    <label>
      Follow-up Date
    </label>

    <input
      type="date"
      name="followUpDate"
      value={formData.followUpDate}
      onChange={handleChange}
    />

  </div>


  {/* SOURCE */}

  <div className="input-group">

    <label>
      Lead Source
    </label>

    <input
      type="text"
      name="source"
      placeholder="Lead Source"
      value={formData.source}
      onChange={handleChange}
    />

  </div>


  {/* ASSIGNED */}

  <div className="input-group">

    <label>
      Assigned To
    </label>

    <input
      type="text"
      name="assignedTo"
      placeholder="Assigned To"
      value={formData.assignedTo}
      onChange={handleChange}
    />

  </div>

</div>


                <textarea
                  name="remark"
                  rows="4"
                  placeholder="Remarks..."
                  value={formData.remark}
                  onChange={handleChange}
                ></textarea>


                <button
                  type="submit"
                  className="submit-btn"
                >

                  Save Customer

                </button>

              </form>

            </div>

          </div>
        )
      }


      {/* PROFILE MODAL */}

      {
        showProfile && (

          <div className="modal-overlay">

            <div className="profile-modal">

              <div className="profile-header">

                <h2>
                  User Profile
                </h2>

                <FaTimes
                  className="close-icon"
                  onClick={() =>
                    setShowProfile(false)
                  }
                />

              </div>


              <div className="profile-content">

                <div className="profile-avatar">

                  <FaUserCircle />

                </div>


                <div className="profile-box">

                  <span>
                    Full Name
                  </span>

                  <h3>
                    {user?.name}
                  </h3>

                </div>


                <div className="profile-box">

                  <span>
                    Email
                  </span>

                  <h3>
                    {user?.email}
                  </h3>

                </div>


                <div className="profile-box">

                  <span>
                    Role
                  </span>

                  <h3>
                    CRM Employee
                  </h3>

                </div>

              </div>

            </div>

          </div>
        )
      }

    </div>
  );
};

export default Dashboard;
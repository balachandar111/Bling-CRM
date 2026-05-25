// 📁 src/pages/Dashboard.jsx


import React,
{
  useEffect,
  useState,
} from "react";
import Calendar from "react-calendar";

import API from "../services/api";

import * as XLSX from "xlsx";
import "react-calendar/dist/Calendar.css";


import {
  useNavigate,
} from "react-router-dom";
import {
  FaSearch
} from "react-icons/fa";

import {

  FaTachometerAlt,
  FaUsers,
  FaBell,
  FaChartLine,
  FaMoneyBillWave,
  FaUserCheck,
  FaTasks,
  FaPlus,
FaSignOutAlt,
FaUserCircle,
FaEdit,
FaSync,

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



    const [showUserModal,
setShowUserModal] =
useState(false);

const [userForm,
setUserForm] =
useState({

  name: "",

  email: "",

  password: "",

  role: "user",
});
const handleUserChange =
(e) => {

  setUserForm({

    ...userForm,

    [e.target.name]:
      e.target.value,
  });
};

const createUser =
async (e) => {

  e.preventDefault();

  try {

    await API.post(

      "/auth/register",

      userForm
    );

    alert(
      "User Created Successfully"
    );

    fetchUsers();

    setShowUserModal(false);

    setUserForm({

      name: "",

      email: "",

      password: "",

      role: "user",
    });

  } catch (error) {

    console.log(error);

    alert(
      error.response?.data?.message
    );
  }
};
const deleteCustomer = async (customer) => {

  // CHECK OBJECT

  if (!customer || !customer._id) {

    alert("Customer ID not found");

    return;
  }

  const confirmDelete =
    window.confirm(
      "Delete this customer?"
    );

  if (!confirmDelete)
    return;

  try {

    console.log(
      "Deleting Customer ID =>",
      customer._id
    );

    await API.delete(

      `/customers/${customer._id}`
    );

    alert(
      "Customer Deleted Successfully"
    );

    fetchCustomers();

    setShowCustomerDetails(false);

  } catch (error) {

    console.log(error);

    alert(

      error.response?.data?.message ||

      "Delete Failed"
    );
  }
};

const [showCustomerDetails,
setShowCustomerDetails] =
useState(false);

//for Create employee
const [showEmployeeModal,
setShowEmployeeModal] =
useState(false);

const [employeeForm,
setEmployeeForm] =
useState({

  name: "",

  email: "",

  password: "",

  phone: "",

  department: "",

  designation: "",

  salary: "",

  joiningDate: "",

  profileImage: null,

  documents: [],
});
const handleEmployeeChange =
(e) => {

  const { name, value } =
    e.target;

  setEmployeeForm({

    ...employeeForm,

    [name]: value,
  });
};
const handleEmployeeFiles =
(e) => {

  const { name, files } =
    e.target;

  if (name === "documents") {

    setEmployeeForm({

      ...employeeForm,

      documents: files,
    });

  } else {

    setEmployeeForm({

      ...employeeForm,

      [name]: files[0],
    });
  }
};
const addEmployee =
async (e) => {

  e.preventDefault();

  try {

    const formData =
      new FormData();

    // ================= TEXT FIELDS =================

    formData.append(
      "name",
      employeeForm.name
    );

    formData.append(
      "email",
      employeeForm.email
    );

    formData.append(
      "password",
      employeeForm.password
    );

    formData.append(
      "phone",
      employeeForm.phone
    );

    formData.append(
      "department",
      employeeForm.department
    );

    formData.append(
      "designation",
      employeeForm.designation
    );

    formData.append(
      "salary",
      employeeForm.salary
    );

    formData.append(
      "joiningDate",
      employeeForm.joiningDate
    );


    // ================= PROFILE IMAGE =================

    if (
      employeeForm.profileImage
    ) {

      formData.append(

        "profileImage",

        employeeForm.profileImage
      );
    }


    // ================= DOCUMENTS =================

    if (
      employeeForm.documents
    ) {

      for (

        let i = 0;

        i <
        employeeForm.documents.length;

        i++
      ) {

        formData.append(

          "documents",

          employeeForm.documents[i]
        );
      }
    }


    // ================= API =================

    const { data } =
      await API.post(

        "/employees/register",

        formData,

        {
          headers: {

            "Content-Type":
            "multipart/form-data",
          },
        }
      );

    console.log(data);

    alert(
      "Employee Added Successfully"
    );

    fetchEmployees();

    setShowEmployeeModal(false);

  } catch (error) {

    console.log(error);

    alert(

      error.response?.data?.message ||

      "Employee upload failed"
    );
  }
};
  // ================= USER =================

const storedUser =
localStorage.getItem(
  "user"
);

const user =
storedUser

? JSON.parse(storedUser)

: null;


const [fromDate,
setFromDate] =
useState("");

const [toDate,
setToDate] =
useState("");

  // ================= STATES =================
  const role =
localStorage.getItem("role");

  const [customers, setCustomers] =
    useState([]);
    const [users, setUsers] =
useState([]);

  const [employees, setEmployees] =
    useState([]);

const [showModal, setShowModal] =
useState(false);

const [showUpdateModal, setShowUpdateModal] =
useState(false);
const [showCustomerUpdate,
setShowCustomerUpdate] =
useState(false);
const [showStatusModal, setShowStatusModal] =
useState(false);

const [selectedCustomer, setSelectedCustomer] =
useState(null);

const [showProfile, setShowProfile] =
useState(false);
const [selectedUser,
setSelectedUser] =
useState("");


const [solutionFilter,
setSolutionFilter] =
useState("");

const [productFilter,
setProductFilter] =
useState("");

const [priorityFilter,
setPriorityFilter] =
useState("");

const [statusFilter,
setStatusFilter] =
useState("");


const [dashboardType,
setDashboardType] =
useState("overall");

const [analyticsFilter,
setAnalyticsFilter] =
useState("overall");


  const [activeMenu, setActiveMenu] =
    useState("dashboard");
const [searchTerm, setSearchTerm] =
useState("");
useEffect(() => {

  setCurrentPage(1);

}, [searchTerm]);
const [currentPage, setCurrentPage] =
useState(1);
const [selectedDate,
setSelectedDate] =
useState(new Date());

const [selectedCustomers,
setSelectedCustomers] =
useState([]);

const [todayReminders,
setTodayReminders] =
useState([]);
const customersPerPage = 7;
const [userSearch,
setUserSearch] =
useState("");

const [showUserList,
setShowUserList] =
useState(false);
const filteredUsers =
users.filter((user) =>

  user.name
  .toLowerCase()

  .includes(

    userSearch
    .toLowerCase()
  )
);


//cust update


const fetchUsers =
async () => {

  try {

    const { data } =
    await API.get("/users");

    setUsers(data.users);

  } catch (error) {

    console.log(error);
  }
};

const [showEmployeeUpdate,
setShowEmployeeUpdate] =
useState(false);

const [selectedEmployee,
setSelectedEmployee] =
useState(null);
const handleEmployeeUpdate =
(employee) => {

  setSelectedEmployee(
    employee
  );

  setEmployeeForm({

    name:
      employee.name || "",

    email:
      employee.email || "",

    password: "",

    phone:
      employee.phone || "",

    department:
      employee.department || "",

    designation:
      employee.designation || "",

    salary:
      employee.salary || "",

    joiningDate:
      employee.joiningDate
      ?.slice(0, 10) || "",

    profileImage: null,

    documents: [],
  });

  setShowEmployeeUpdate(true);
};
const updateEmployee =
async (e) => {

  e.preventDefault();

  try {

    const formData =
      new FormData();

    Object.keys(employeeForm)
    .forEach((key) => {

      if (

        key !== "profileImage" &&

        key !== "documents"
      ) {

        formData.append(

          key,

          employeeForm[key]
        );
      }
    });


    // IMAGE

    if (
      employeeForm.profileImage
    ) {

      formData.append(

        "profileImage",

        employeeForm.profileImage
      );
    }


    // DOCUMENTS

    for (

      let i = 0;

      i <
      employeeForm.documents.length;

      i++
    ) {

      formData.append(

        "documents",

        employeeForm.documents[i]
      );
    }


   await API.put(

  `/employees/${selectedEmployee._id}`,

  formData,

  {
    headers: {

      "Content-Type":
      "multipart/form-data",
    },
  }
);

    alert(
      "Employee Updated"
    );

    fetchEmployees();

    setShowEmployeeUpdate(false);

  } catch (error) {

    console.log(error);

    alert(
      error.response?.data?.message
    );
  }
};


const [showEditUserModal,
setShowEditUserModal] =
useState(false);

const [selectedEditUser,
setSelectedEditUser] =
useState(null);

const [editUserForm,
setEditUserForm] =
useState({

  name: "",

  email: "",

  password: "",

  role: "user",
});
const handleEditUser =
(user) => {

  setSelectedEditUser(user);

  setEditUserForm({

    name:
      user.name || "",

    email:
      user.email || "",

    password: "",

    role:
      user.role || "user",
  });

  setShowEditUserModal(true);
};
const updateUserData =
async (e) => {

  e.preventDefault();

  try {

    await API.put(

      `/users/${selectedEditUser._id}`,

      editUserForm
    );

    alert(
      "User Updated Successfully"
    );

    fetchUsers();

    setShowEditUserModal(false);

  } catch (error) {

    console.log(error);

    alert(
      error.response?.data?.message
    );
  }
};




const filterByUser =
async (userId) => {

  try {

    let url =
      "/customers";

    if (userId) {

      url =
      `/customers?userId=${userId}`;
    }

    const { data } =
      await API.get(url);

    setCustomers(
      data.customers
    );

  } catch (error) {

    console.log(error);
  }
};
  // ================= FORM =================
const filteredCustomers =

customers.filter((customer) => {

  // SEARCH

  const matchesSearch =

    customer.name
    ?.toLowerCase()
    .includes(
      searchTerm.toLowerCase()
    )

    ||

    customer.email
    ?.toLowerCase()
    .includes(
      searchTerm.toLowerCase()
    )

    ||

    customer.phone
    ?.includes(searchTerm);


  // SOLUTION

  const matchesSolution =

    !solutionFilter ||

    customer.solution ===
    solutionFilter;


  // PRODUCT

  const matchesProduct =

    !productFilter ||

    customer.product ===
    productFilter;


  // PRIORITY

  const matchesPriority =

    !priorityFilter ||

    customer.priority ===
    priorityFilter;


  // STATUS / LEAD STAGE

  const matchesStatus =

    !statusFilter ||

    customer.leadStage ===
    statusFilter;


  return (

    matchesSearch &&

    matchesSolution &&

    matchesProduct &&

    matchesPriority &&

    matchesStatus
  );
});

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

      solution: "",

      product: "",
    });
// ================= PAGINATION =================

const indexOfLastCustomer =

currentPage *
customersPerPage;

const indexOfFirstCustomer =

indexOfLastCustomer -
customersPerPage;

const currentCustomers =

filteredCustomers.slice(

  indexOfFirstCustomer,

  indexOfLastCustomer
);

const totalPages = Math.ceil(

  filteredCustomers.length /
  customersPerPage
);


// ================= FORMAT DATE =================

const formatDate = (date) => {

  return new Date(date)
    .toISOString()
    .split("T")[0];
};
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


const fetchCustomers =
async () => {

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


  // ================= FETCH EMPLOYEES =================

  const fetchEmployees =
  async () => {

    try {

      const { data } =
      await API.get(
        "/employees/all"
      );

      setEmployees(
        data.employees
      );

    } catch (error) {

      console.log(error);
    }
  };


  useEffect(() => {

   fetchCustomers();

fetchEmployees();

if (role === "super_admin") {
  fetchUsers();
}

  }, []);
// ================= TODAY REMINDER =================

useEffect(() => {

  const today =
    formatDate(new Date());

  const reminders =
    customers.filter(
      (customer) =>

        customer.followUpDate
          ?.slice(0, 10) ===
        today
    );

  setTodayReminders(
    reminders
  );

}, [customers]);


// ================= SELECTED DATE =================

useEffect(() => {

  const formatted =
    formatDate(selectedDate);

  const filtered =
    customers.filter(
      (customer) =>

        customer.followUpDate
          ?.slice(0, 10) ===
        formatted
    );

  setSelectedCustomers(
    filtered
  );

}, [selectedDate, customers]);

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
        solution: "",
product: "",
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
// ================= FULL UPDATE =================

const handleFullUpdate = (customer) => {

  console.log("Selected Customer =>", customer);

  if (!customer || !customer._id) {

    alert("Invalid customer");

    return;
  }

  setSelectedCustomer(customer);

  setFormData({

    name: customer.name || "",

    company: customer.company || "",

    email: customer.email || "",

    phone: customer.phone || "",

    source: customer.source || "",

    leadStage: customer.leadStage || "",

    priority: customer.priority || "",

    assignedTo: customer.assignedTo || "",

    remark: customer.remark || "",

    investment: customer.investment || "",

    followUpDate:
      customer.followUpDate
      ?.slice(0, 10) || "",
  });

  setShowCustomerUpdate(true);
};


// ================= SAVE FULL UPDATE =================

const saveFullUpdate = async (e) => {

  e.preventDefault();

  // CHECK CUSTOMER

  if (!selectedCustomer || !selectedCustomer._id) {

    alert("Customer not selected");

    return;
  }

  try {

    console.log("Updating ID =>", selectedCustomer._id);

    const response = await API.put(

      `/customers/${selectedCustomer._id}`,

      formData
    );

    console.log(response.data);

    alert("Customer Updated Successfully");

    fetchCustomers();

    setShowCustomerUpdate(false);

  } catch (error) {

    console.log(error);

    alert(
      error.response?.data?.message ||
      "Update Failed"
    );
  }
};


// ================= STATUS UPDATE =================

const handleStatusUpdate =
(customer) => {

  setSelectedCustomer(customer);

  setFormData({

    leadStage:
      customer.leadStage,

    status:
      customer.status,
  });

  setShowStatusModal(true);
};
const updateCustomer =
async (e) => {

  e.preventDefault();

  try {

    await API.put(

      `/customers/${selectedCustomer._id}`,

      formData
    );

    alert(
      "Customer Updated"
    );

    fetchCustomers();

    setShowCustomerUpdate(false);

  } catch (error) {

    console.log(error);
  }
};
const updateLeadStatus =
async (status) => {

  try {

   await API.put(

  `/customers/${selectedCustomer._id}`,

  {
    leadStage: status,
  }
);

    alert(
      "Status Updated"
    );

    fetchCustomers();

    setShowStatusModal(false);

  } catch (error) {

    console.log(error);
  }
};

// ================= SAVE STATUS =================

const saveStatusUpdate =
async (e) => {

  e.preventDefault();

  try {

    await API.put(

      `/customers/${selectedCustomer._id}`,

      {

        leadStage:
          formData.leadStage,

        status:
          formData.status,
      }
    );

    alert(
      "Status Updated Successfully"
    );

    fetchCustomers();

    setShowStatusModal(false);

  } catch (error) {

    console.log(error);
  }
};

  // ================= BULK UPLOAD =================
const handleFileUpload =
async (e) => {

  const file =
    e.target.files[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload =
  async (event) => {

    try {

      const data =
        event.target.result;

      const workbook =
        XLSX.read(data, {
          type: "binary",
        });

      const sheetName =
        workbook.SheetNames[0];

      const worksheet =
        workbook.Sheets[sheetName];

      const customers =
        XLSX.utils.sheet_to_json(
          worksheet
        );

      console.log(customers);

      const response =
      await API.post(

        "/customers/bulk-upload",

        {
          customers,
        }
      );

      console.log(response.data);

      alert(
        "Customers Uploaded"
      );

      fetchCustomers();

    } catch (error) {

      console.log(error);

      alert(
        error.response?.data?.message
      );
    }
  };

  reader.readAsBinaryString(
    file
  );
};


  // ================= ANALYTICS =================



 // ================= FILTER ANALYTICS =================

// ================= DATE FILTER =================

const getFilteredCustomers =
() => {

  // NO FILTER

  if (
    !fromDate &&
    !toDate
  ) {

    return customers;
  }

  return customers.filter(
    (customer) => {

      const customerDate =
        new Date(
          customer.createdAt
        );

      // FROM DATE

      if (fromDate) {

        const startDate =
          new Date(fromDate);

        startDate.setHours(
          0, 0, 0, 0
        );

        if (
          customerDate <
          startDate
        ) {

          return false;
        }
      }

      // TO DATE

      if (toDate) {

        const endDate =
          new Date(toDate);

        endDate.setHours(
          23, 59, 59, 999
        );

        if (
          customerDate >
          endDate
        ) {

          return false;
        }
      }

      return true;
    }
  );
};


// ================= FILTERED CUSTOMERS =================

const analyticsCustomers =
getFilteredCustomers();


// ================= ANALYTICS =================

const totalCustomers =
analyticsCustomers.length;

const converted =
analyticsCustomers.filter(

  (c) =>
    c.leadStage ===
    "Closure"

).length;

const activeLeads =
analyticsCustomers.filter(

  (c) =>
    c.leadStage !==
    "Closure"

).length;


// ================= STAGE DATA =================

const stageData = [

  {
    name: "Awareness",

    value:
      analyticsCustomers.filter(
        (c) =>
          c.leadStage ===
          "Awareness"
      ).length,
  },

  {
    name: "Interest",

    value:
      analyticsCustomers.filter(
        (c) =>
          c.leadStage ===
          "Interest"
      ).length,
  },

  {
    name: "Desire",

    value:
      analyticsCustomers.filter(
        (c) =>
          c.leadStage ===
          "Desire"
      ).length,
  },

  {
    name: "Closure",

    value:
      analyticsCustomers.filter(
        (c) =>
          c.leadStage ===
          "Closure"
      ).length,
  },
];


// ================= SOURCE DATA =================

const sourceData = [

  {
    name: "Website",

    value:
      analyticsCustomers.filter(
        (c) =>
          c.source ===
          "Website"
      ).length,
  },

  {
    name: "Instagram",

    value:
      analyticsCustomers.filter(
        (c) =>
          c.source ===
          "Instagram"
      ).length,
  },

  {
    name: "LinkedIn",

    value:
      analyticsCustomers.filter(
        (c) =>
          c.source ===
          "LinkedIn"
      ).length,
  },

  {
    name: "Referral",

    value:
      analyticsCustomers.filter(
        (c) =>
          c.source ===
          "Referral"
      ).length,
  },
];


// ================= PERFORMANCE DATA =================

const performanceData = [

  {
    name: "Awareness",

    value:
      analyticsCustomers.filter(
        (c) =>
          c.leadStage ===
          "Awareness"
      ).length,
  },

  {
    name: "Interest",

    value:
      analyticsCustomers.filter(
        (c) =>
          c.leadStage ===
          "Interest"
      ).length,
  },

  {
    name: "Desire",

    value:
      analyticsCustomers.filter(
        (c) =>
          c.leadStage ===
          "Desire"
      ).length,
  },

  {
    name: "Closure",

    value:
      analyticsCustomers.filter(
        (c) =>
          c.leadStage ===
          "Closure"
      ).length,
  },
];



// ================= FILTER CUSTOMERS =================



  // ================= CHART DATA =================







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

 <img

    src="https://res.cloudinary.com/ds4i8pujs/image/upload/v1779687977/bling_tech_logo_h7rc1m.png"

    alt="logo"

    className="crm-logo"
  />

 

</div>


      <ul>

  {/* DASHBOARD */}

  <li

    className={
      activeMenu ===
      "dashboard"

        ? "active"

        : ""
    }

    onClick={() =>
      setActiveMenu(
        "dashboard"
      )
    }
  >

    <FaTachometerAlt />

    Dashboard

  </li>
<li

  className={
    activeMenu ===
    "customers"

      ? "active"

      : ""
  }

  onClick={() =>
    setActiveMenu(
      "customers"
    )
  }
>

  <FaUserCheck />

  Customers

</li>

  {/* EMPLOYEES - SUPER ADMIN ONLY */}
<li

  className={
    activeMenu ===
    "employees"

      ? "active"

      : ""
  }

  onClick={() =>
    setActiveMenu(
      "employees"
    )
  }
>

  <FaUsers />

  Employees

</li>


  {/* USER MANAGEMENT - SUPER ADMIN ONLY */}

  {
    role ===
    "super_admin" && (

      <li

        className={
          activeMenu ===
          "users"

            ? "active"

            : ""
        }

        onClick={() =>
          setActiveMenu(
            "users"
          )
        }
      >

        <FaUserCheck />

        User Management

      </li>
    )
  }


  {/* ACTIVITIES */}

  {/* <li>

    <FaTasks />

    Activities

  </li> */}


  {/* REMINDERS */}

  <li

    className={
      activeMenu ===
      "reminders"

        ? "active"

        : ""
    }

    onClick={() =>
      setActiveMenu(
        "reminders"
      )
    }
  >

    <FaBell />

    Reminders

    {
      todayReminders.length > 0 && (

        <span className="notify-badge">

          {
            todayReminders.length
          }

        </span>
      )
    }

  </li>


  {/* PROFILE */}

  <li
    onClick={() =>
      setShowProfile(true)
    }
  >

    <FaUserCircle />

    {user?.name}

  </li>

</ul>


        <button
          className="logout-btn"
          onClick={handleLogout}
        >

          <FaSignOutAlt />

          Logout

        </button>

      </div>
      


      {/* MAIN */}

      <div className="main-content">


        {/* ================= DASHBOARD ================= */}

        {
          activeMenu ===
          "dashboard" && (

            <>

              {/* TOPBAR */}

              <div className="topbar">

                <div>

                  <h1>
                    CRM Analytics Dashboard
                  </h1>

                  <p>
                    Sales &
                    Customer Insights
                  </p>
   <div className="action-buttons">
          
                  
                  
    {
  role ===
  "super_admin" && (

    <div
      className="
dashboard-user-filter
"
    >

      {/* SEARCH WRAPPER */}

   <div
  className="
user-search-wrapper
"
>

  {/* SEARCH ICON */}

  <FaSearch
    className="
search-icon
"
  />


  {/* INPUT */}

  <input

    type="text"

    placeholder="
Search user dashboard...
"

    value={
      userSearch
    }

    onChange={(e) => {

      setUserSearch(
        e.target.value
      );

      setShowUserList(
        true
      );
    }}

    onFocus={() =>
      setShowUserList(
        true
      )
    }

    className="
user-search-input
"
  />

</div>

      {/* USER LIST */}

      {
        showUserList && (

          <div
            className="
user-search-list
"
          >

            {/* OVERALL DASHBOARD */}

            <div

              className="
user-search-item
"

              onClick={
                async () => {

                  setSelectedUser("");

                  setUserSearch(
                    "Overall Dashboard"
                  );

                  setShowUserList(
                    false
                  );

                  await filterByUser(
                    ""
                  );
                }
              }
            >

              Overall Dashboard

            </div>


            {/* USER LIST */}

            {
              filteredUsers.length >
              0 ? (

                filteredUsers.map(
                  (user) => (

                    <div

                      key={
                        user._id
                      }

                      className="
user-search-item
"

                      onClick={
                        async () => {

                          setSelectedUser(
                            user._id
                          );

                          setUserSearch(
                            user.name
                          );

                          setShowUserList(
                            false
                          );

                          await filterByUser(
                            user._id
                          );
                        }
                      }
                    >

                      <div
                        className="
user-item-content
"
                      >

                        <div
                          className="
user-avatar
"
                        >

                          {
                            user.name
                            ?.charAt(0)
                            ?.toUpperCase()
                          }

                        </div>

                        <div>

                          <h4>

                            {user.name}

                          </h4>

                          <p>

                            {user.email}

                          </p>

                        </div>

                      </div>

                    </div>
                  )
                )

              ) : (

                <div
                  className="
no-user-found
"
                >

                  No users found

                </div>
              )
            }

          </div>
        )
      }

    </div>
  )
}


                </div>
                
                </div>
<div className="
date-filter-container
"
>
   <h3>
    Filter:
  </h3>

  {/* FROM DATE */}

  <div className="
date-filter-box
"
  >

    <label>
      From Date
    </label>

    <input

      type="date"

      value={fromDate}

      onChange={(e) =>

        setFromDate(
          e.target.value
        )
      }
    />

  </div>


  {/* TO DATE */}

  <div className="
date-filter-box
"
  >

    <label>
      To Date
    </label>

    <input

      type="date"

      value={toDate}

      onChange={(e) =>

        setToDate(
          e.target.value
        )
      }
    />

  </div>


  {/* CLEAR */}

  <button

    className="
clear-filter-btn
"

    onClick={() => {

      setFromDate("");

      setToDate("");
    }}
  >

    Clear

  </button>
  

</div>

             

              </div>


              {/* STATS */}

              <div className="stats-grid">

                <div className="stat-card">

                  <div>

                    <h4>
                      Total Leads
                    </h4>

                    <h2>
                      {
                        totalCustomers
                      }
                    </h2>

                  </div>

                  <FaUsers className="icon blue" />

                </div>


                <div className="stat-card">

                  <div>

                   <h4>
  Today's Follow Ups
</h4>

                   <h2>
  {
    todayReminders.length
  }
</h2>

                  </div>

              <FaBell className="icon green" />

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

                  <FaUserCheck className="icon purple" />

                </div>


                <div className="stat-card">

                  <div>

                    <h4>
                      Active Leads
                    </h4>

                    <h2>
                      {
                        activeLeads
                      }
                    </h2>

                  </div>

                  <FaChartLine className="icon orange" />

                </div>

              </div>


              {/* CHARTS */}

              <div className="charts-grid">
                

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

                        {
                          stageData.map(
                            (
                              entry,
                              index
                            ) => (

                              <Cell
                                key={index}
                                fill={
                                  COLORS[
                                    index
                                  ]
                                }
                              />
                            )
                          )
                        }

                      </Pie>

                      <Tooltip />

                    </PieChart>

                  </ResponsiveContainer>

                </div>


                <div className="chart-card">

                 <h3>
  User Performance Analytics
</h3>

                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >

                    <BarChart
                     data={performanceData}
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
  dataKey="value"
  fill="#2563EB"
/>

                    </BarChart>

                  </ResponsiveContainer>

                </div>

              </div>


              {/* EXTRA ANALYTICS */}

              <div className="charts-grid">

                <div className="chart-card">

                  <h3>
                    Lead Source Analytics
                  </h3>

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >

                    <AreaChart
                      data={sourceData}
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
                        dataKey="value"
                        stroke="#7C3AED"
                        fill="#C4B5FD"
                      />

                    </AreaChart>

                  </ResponsiveContainer>

                </div>


                <div className="chart-card">

                  <h3>
                    Customer Pipeline
                  </h3>

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >

                    <LineChart
                      data={stageData}
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
                        dataKey="value"
                        stroke="#2563EB"
                        strokeWidth={4}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              </div>


          




  


            


            </>
          )
        }
        {/* ================= CUSTOMERS ================= */}

{/* ================= CUSTOMERS ================= */}

{/* ================= CUSTOMERS ================= */}

{
  activeMenu === "customers" && (

    <div className="customer-page">

      {/* HEADER */}

      <div className="customer-topbar">

        <div>

          <h2 className="page-title">
            Customer Management
          </h2>

          <p className="page-subtitle">
            Manage customer records
          </p>

        </div>
        

        <div className="top-actions">
          

          <input
            type="text"
            placeholder="Search customer..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            className="search-input"
          />

          <button
            className="add-btn"
            onClick={() =>
              setShowModal(true)
            }
          >
            Add Customer
          </button>
         <label className="bulk-upload-btn">

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
<div className="customer-filters">

  <div className="filter-item">

    <label>
      Solution
    </label>

    <select
      value={solutionFilter}
      onChange={(e) =>
        setSolutionFilter(
          e.target.value
        )
      }
    >

      <option value="">
        All
      </option>

      <option>Anti-Counterfeiting</option>
      <option>Customer Engagement</option>
      <option>Retail Intelligence</option>
      <option>Digital Warranty</option>

    </select>

  </div>


  <div className="filter-item">

    <label>
      Product
    </label>

    <select
      value={productFilter}
      onChange={(e) =>
        setProductFilter(
          e.target.value
        )
      }
    >

      <option value="">
        All
      </option>

      <option>
        AI Chatbot
      </option>
      <option>
        Dealer Order Management
      </option>
      <option>
        RFID Inventory management
      </option>
      <option>
        Custom Application Development
      </option>
    </select>

  </div>


  <div className="filter-item">

    <label>
      Priority
    </label>

    <select
      value={priorityFilter}
      onChange={(e) =>
        setPriorityFilter(
          e.target.value
        )
      }
    >

      <option value="">
        All
      </option>

      <option>
        High
      </option>

      <option>
        Medium
      </option>

      <option>
        Low
      </option>

    </select>

  </div>


  <div className="filter-item">

    <label>
      Stage
    </label>

    <select
      value={statusFilter}
      onChange={(e) =>
        setStatusFilter(
          e.target.value
        )
      }
    >

      <option value="">
        All
      </option>

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

</div>


      {/* TABLE */}

      <div className="minimal-table-wrapper">

        <table className="minimal-table">

          <thead>

            <tr>

              <th>Name</th>

              <th>Company</th>

              <th>Phone</th>

              <th>Status</th>
               <th>Priority</th>
              <th>Solution</th>
              <th>Product</th>

             
              <th>
  Last Modified
</th>

              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {
               currentCustomers.map(
    (customer) => (

                  <tr
                    key={customer._id}

                    onClick={() => {

                      setSelectedCustomer(
                        customer
                      );

                      setShowCustomerDetails(
                        true
                      );
                    }}
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

                      <span className="status-badge">

                        {
                          customer.leadStage
                        }

                      </span>

                    </td>

                    <td>

                      <span className="priority-badge">

                        {
                          customer.priority
                        }

                      </span>

                    </td>
                    <td>
  {customer.solution || "-"}
</td>

<td>
  {customer.product || "-"}
</td>
           <td>

  {
    customer.lastModified

    ? new Date(
        customer.lastModified
      ).toLocaleString()

    : "Not Modified"
  }

</td>

                    <td>

                      <div
                        className="action-btns"

                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >

                        <button

                          className="table-btn edit-btn"

                          onClick={() =>
                            handleFullUpdate(
                              customer
                            )
                          }
                        >

                          Edit

                        </button>


                        <button

                          className="table-btn status-btn"

                          onClick={() =>
                            handleStatusUpdate(
                              customer
                            )
                          }
                        >

                          Status

                        </button>


                        <button

                          className="table-btn delete-btn"

                          onClick={() =>
                            deleteCustomer(
                              customer
                            )
                          }
                        >

                          Delete

                        </button>

                      </div>

                    </td>

                  </tr>
                )
              )
            }

          </tbody>

        </table>
          <div className="pagination">

          <button

            disabled={
              currentPage === 1
            }

            onClick={() =>
              setCurrentPage(
                currentPage - 1
              )
            }
          >

            Previous

          </button>


          {
            [...Array(totalPages)]
            .map((_, index) => (

              <button

                key={index}

                className={
                  currentPage ===
                  index + 1

                    ? "active-page"

                    : ""
                }

                onClick={() =>
                  setCurrentPage(
                    index + 1
                  )
                }
              >

                {index + 1}

              </button>
            ))
          }


          <button

            disabled={
              currentPage ===
              totalPages
            }

            onClick={() =>
              setCurrentPage(
                currentPage + 1
              )
            }
          >

            Next

          </button>

        </div>

      </div>

    </div>
  )
}
{/* ================= REMINDERS ================= */}

{
  activeMenu ===
  "reminders" && (

    <div className="reminder-page">

      <div className="reminder-header">

        <div>

          <h1>
            Follow Up Reminders
          </h1>

          <p>
            Select a date to view follow-up customers
          </p>

        </div>

      </div>


      {
        todayReminders.length > 0 && (

          <div className="today-alert">

            🔔 You have
            {" "}
            {
              todayReminders.length
            }
            {" "}
            follow-up(s) today

          </div>
        )
      }


      <div className="reminder-grid">


        {/* CALENDAR */}

        <div className="calendar-card">

          <Calendar

            onChange={
              setSelectedDate
            }

            value={
              selectedDate
            }

            tileClassName={({
              date,
            }) => {

              const formatted =
                formatDate(date);

              const hasReminder =
                customers.some(
                  (customer) =>

                    customer.followUpDate
                      ?.slice(0, 10) ===
                    formatted
                );

              return hasReminder
                ? "highlight-date"
                : null;
            }}
          />

        </div>


        {/* CUSTOMER LIST */}

        <div className="followup-card">

          <div className="followup-header">

            <h2>
              Follow Up Customers
            </h2>

            <span className="date-badge">

              {
                selectedDate.toDateString()
              }

            </span>

          </div>


          {
            selectedCustomers.length === 0 ? (

              <div className="empty-state">

                No follow-ups found

              </div>

            ) : (

              selectedCustomers.map(
                (customer) => (

                 <div

  key={
    customer._id
  }

  className="customer-box"

  onClick={() => {

    setSelectedCustomer(customer);

    setShowCustomerDetails(true);
  }}
>

                    <div>

                      <h3>
                        {
                          customer.name
                        }
                      </h3>

                      <p>
                        {
                          customer.company
                        }
                      </p>

                      <small>
                        {
                          customer.phone
                        }
                      </small>

                    </div>


                    <div className="right-box">

                      <span className="priority-pill">

                        {
                          customer.priority
                        }

                      </span>

                      <span className="stage-pill">

                        {
                          customer.leadStage
                        }

                      </span>
               
                      

                    </div>

                  </div>
                )
              )
            )
          }

        </div>

      </div>

    </div>
  )
}

        {/* ================= EMPLOYEES ================= */}

      {
  activeMenu === "employees" && (

    <div className="employee-page">

      {/* TOP HEADER */}

      <div className="employee-topbar">

        <div>

          <h1>
            Employee Management
          </h1>

          <p>
            Manage employee records
          </p>

        </div>

        <button
          className="add-btn"
          onClick={() =>
            setShowEmployeeModal(true)
          }
        >

          <FaPlus />

          Add Employee

        </button>

      </div>


      {/* TABLE */}

      <div className="employee-table-container">

        <table className="minimal-employee-table">

          <thead>

            <tr>

              <th>
                Employee
              </th>

              <th>
                Department
              </th>

              <th>
                Designation
              </th>

              <th>
                Contact
              </th>

              <th>
                Salary
              </th>

              <th>
                Documents
              </th>

              <th>
                Actions
              </th>

            </tr>

          </thead>


          <tbody>

            {
              [...employees]

              .sort(
                (a, b) =>

                  new Date(b.createdAt) -
                  new Date(a.createdAt)
              )

              .map((employee) => (

                <tr
                  key={employee._id}
                >

                  {/* EMPLOYEE */}

                  <td>

                    <div className="employee-info">

                      <img

                        src={
                          employee.profileImage
                        }

                        alt="profile"

                        className="employee-avatar"
                      />

                      <div>

                        <h4>
                          {employee.name}
                        </h4>

                        <p>
                          {employee.email}
                        </p>

                      </div>

                    </div>

                  </td>


                  {/* DEPARTMENT */}

                  <td>
                    {employee.department}
                  </td>


                  {/* DESIGNATION */}

                  <td>
                    {employee.designation}
                  </td>


                  {/* CONTACT */}

                  <td>
                    {employee.phone}
                  </td>


                  {/* SALARY */}

                  <td>

                    ₹{employee.salary}

                  </td>


                  {/* DOCUMENTS */}

                  <td>

                    {
                      employee.documents
                      ?.length > 0 ? (

                        <a

                          href={
                            employee.documents[0]
                          }

                          target="_blank"

                          rel="noreferrer"

                          className="view-doc-btn"
                        >

                          View

                        </a>

                      ) : (

                        <span className="no-doc">

                          No Docs

                        </span>
                      )
                    }

                  </td>


                  {/* ACTIONS */}

                  <td>

                    <div className="employee-action-buttons">

                      <button

                        className="table-edit-btn"

                        onClick={() =>
                          handleEmployeeUpdate(
                            employee
                          )
                        }
                      >

                        Edit

                      </button>


                      <button

                        className="table-delete-btn"

                        onClick={
                          async () => {

                            const confirmDelete =
                              window.confirm(
                                "Delete this employee?"
                              );

                            if (!confirmDelete)
                              return;

                            try {

                              await API.delete(

                                `/employees/${employee._id}`
                              );

                              alert(
                                "Employee Deleted"
                              );

                              fetchEmployees();

                            } catch (error) {

                              console.log(error);

                              alert(
                                error.response?.data?.message
                              );
                            }
                          }
                        }
                      >

                        Delete

                      </button>

                    </div>

                  </td>

                </tr>
              ))
            }

          </tbody>

        </table>

      </div>

    </div>
  )
}
        {
  showEmployeeModal && (

    <div className="modal-overlay">

      <div className="modal">

        <div className="modal-header">

          <h2>
            Add Employee
          </h2>

          <span

            className="close-icon"

            onClick={() =>
              setShowEmployeeModal(false)
            }
          >

            ✕

          </span>

        </div>


        <form
          onSubmit={addEmployee}
        >

          <div className="form-grid">

            {/* NAME */}

            <div className="input-group">

              <label>
                Name
              </label>

              <input

                type="text"

                name="name"

                onChange={
                  handleEmployeeChange
                }

                required
              />

            </div>


            {/* EMAIL */}

            <div className="input-group">

              <label>
                Email
              </label>

              <input

                type="email"

                name="email"

                onChange={
                  handleEmployeeChange
                }

                required
              />

            </div>


            {/* PASSWORD */}

            <div className="input-group">

              <label>
                Password
              </label>

              <input

                type="password"

                name="password"

                onChange={
                  handleEmployeeChange
                }

                required
              />

            </div>


            {/* PHONE */}

            <div className="input-group">

              <label>
                Phone
              </label>

              <input

                type="text"

                name="phone"

                onChange={
                  handleEmployeeChange
                }

              />

            </div>


            {/* DEPARTMENT */}

            <div className="input-group">

              <label>
                Department
              </label>

              <input

                type="text"

                name="department"

                onChange={
                  handleEmployeeChange
                }

              />

            </div>


            {/* DESIGNATION */}

            <div className="input-group">

              <label>
                Designation
              </label>

              <input

                type="text"

                name="designation"

                onChange={
                  handleEmployeeChange
                }

              />

            </div>


            {/* SALARY */}

            <div className="input-group">

              <label>
                Salary
              </label>

              <input

                type="number"

                name="salary"

                onChange={
                  handleEmployeeChange
                }

              />

            </div>


            {/* JOINING DATE */}

            <div className="input-group">

              <label>
                Joining Date
              </label>

              <input

                type="date"

                name="joiningDate"

                onChange={
                  handleEmployeeChange
                }

              />

            </div>


            {/* PROFILE IMAGE */}

            <div className="input-group">

              <label>
                Profile Image
              </label>

             <input

  type="file"

  name="profileImage"

  accept="image/*"

  onChange={
    handleEmployeeFiles
  }
/>

            </div>


            {/* DOCUMENTS */}

            <div className="input-group">

              <label>
                Documents
              </label>

              <input

  type="file"

  name="documents"

  multiple

  onChange={
    handleEmployeeFiles
  }
/>

            </div>

          </div>


          <button
            type="submit"
            className="submit-btn"
          >

            Add Employee

          </button>

        </form>

      </div>

    </div>
  )
}
        {/* ================= USER MANAGEMENT ================= */}

{
  activeMenu ===
  "users" &&

  role ===
  "super_admin" && (

    <div className="employee-section">

      <div className="employee-header">

        <div>

          <h1>
            User Management
          </h1>
          <button

  className="add-btn"

  onClick={() =>
    setShowUserModal(true)
  }
>

  <FaPlus />

  Add User

</button>

          <p>
            Manage users and roles
          </p>

        </div>

      </div>


      <div className="employee-table-wrapper">

        <table className="employee-table">

          <thead>

            <tr>

              <th>
                Name
              </th>

              <th>
                Email
              </th>

              <th>
                Role
              </th>

              <th>
                Change Role
              </th>

            </tr>

          </thead>


          <tbody>

            {
              users.map(
                (user) => (

                  <tr
                    key={user._id}
                  >

                    <td>
                      {user.name}
                    </td>

                    <td>
                      {user.email}
                    </td>

                    <td>
                      {user.role}
                    </td>

                  <td>

  <div
    style={{
      display: "flex",
      gap: "10px",
    }}
  >

    {/* ROLE */}

    <select

      value={
        user.role
      }

      onChange={
        async (e) => {

          try {

            await API.put(

              `/users/${user._id}/role`,

              {
                role:
                e.target.value,
              }
            );

            fetchUsers();

            alert(
              "Role Updated"
            );

          } catch (error) {

            console.log(error);
          }
        }
      }
    >

      <option value="user">

        User

      </option>

      <option value="super_admin">

        Super Admin

      </option>

    </select>


    {/* DELETE */}
    <button

  style={{
    background: "#2563EB",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  }}

  onClick={() =>
    handleEditUser(user)
  }
>

  Update

</button>

    <button

      style={{
        background: "#EF4444",
        color: "white",
        border: "none",
        padding: "8px 14px",
        borderRadius: "8px",
        cursor: "pointer",
      }}

      onClick={
        async () => {

          try {

            await API.delete(

              `/users/${user._id}`
            );

            fetchUsers();

            alert(
              "User Deleted"
            );

          } catch (error) {

            console.log(error);
          }
        }
      }
    >

      Delete

    </button>

  </div>

                    </td>

                  </tr>
                )
              )
            }

          </tbody>

        </table>

      </div>

    </div>
  )
}
{
  showEditUserModal && (

    <div className="modal-overlay">

      <div className="modal">

        <div className="modal-header">

          <h2>
            Update User
          </h2>

          <span

            className="close-icon"

            onClick={() =>
              setShowEditUserModal(false)
            }
          >

            ✕

          </span>

        </div>


        <form
          onSubmit={updateUserData}
        >

          <div className="form-grid">

            {/* NAME */}

            <div className="input-group">

              <label>
                Name
              </label>

              <input

                type="text"

                value={
                  editUserForm.name
                }

                onChange={(e) =>

                  setEditUserForm({

                    ...editUserForm,

                    name:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* EMAIL */}

            <div className="input-group">

              <label>
                Email
              </label>

              <input

                type="email"

                value={
                  editUserForm.email
                }

                onChange={(e) =>

                  setEditUserForm({

                    ...editUserForm,

                    email:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* PASSWORD */}

            <div className="input-group">

              <label>
                Password
              </label>

              <input

                type="password"

                placeholder="
Leave empty if no change
"

                value={
                  editUserForm.password
                }

                onChange={(e) =>

                  setEditUserForm({

                    ...editUserForm,

                    password:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* ROLE */}

            <div className="input-group">

              <label>
                Role
              </label>

              <select

                value={
                  editUserForm.role
                }

                onChange={(e) =>

                  setEditUserForm({

                    ...editUserForm,

                    role:
                    e.target.value,
                  })
                }
              >

                <option value="user">

                  User

                </option>

                <option value="super_admin">

                  Super Admin

                </option>

              </select>

            </div>

          </div>


          <button
            type="submit"
            className="submit-btn"
          >

            Update User

          </button>

        </form>

      </div>

    </div>
  )
}
{
  showUserModal && (

    <div className="modal-overlay">

      <div className="modal">

        <div className="modal-header">

          <h2>
            Add New User
          </h2>

          <span

            className="close-icon"

            onClick={() =>
              setShowUserModal(false)
            }
          >

            ✕

          </span>

        </div>


        <form
          onSubmit={createUser}
        >

          <div className="form-grid">

            {/* NAME */}

            <div className="input-group">

              <label>
                Name
              </label>

              <input

                type="text"

                name="name"

                placeholder="Enter name"

                value={
                  userForm.name
                }

                onChange={
                  handleUserChange
                }

                required
              />

            </div>


            {/* EMAIL */}

            <div className="input-group">

              <label>
                Email
              </label>

              <input

                type="email"

                name="email"

                placeholder="Enter email"

                value={
                  userForm.email
                }

                onChange={
                  handleUserChange
                }

                required
              />

            </div>


            {/* PASSWORD */}

            <div className="input-group">

              <label>
                Password
              </label>

              <input

                type="password"

                name="password"

                placeholder="Enter password"

                value={
                  userForm.password
                }

                onChange={
                  handleUserChange
                }

                required
              />

            </div>


            {/* ROLE */}

            <div className="input-group">

              <label>
                Role
              </label>

              <select

                name="role"

                value={
                  userForm.role
                }

                onChange={
                  handleUserChange
                }
              >

                <option value="user">

                  User

                </option>

                <option value="super_admin">

                  Super Admin

                </option>

              </select>

            </div>

          </div>


          <button
            type="submit"
            className="submit-btn"
          >

            Create User

          </button>

        </form>

      </div>

    </div>
  )
}
        {
  role === "super_admin" && (

    <ul
      className={
        activeMenu === "users"
          ? "active"
          : ""
      }

      onClick={() =>
        setActiveMenu("users")
      }
    >

      

    </ul>
  )
}
{
  showProfile && (

    <div className="modal-overlay">

      <div className="profile-modal">

        <div className="profile-header">

          <h2>
            User Profile
          </h2>

          <span
            className="close-icon"

            onClick={() =>
              setShowProfile(false)
            }
          >

            ✕

          </span>

        </div>


        <div className="profile-content">

          <div className="profile-avatar">

            <FaUserCircle />

          </div>


          <div className="profile-box">

            <span>
              Name
            </span>

            <h3>
              {user?.name || "N/A"}
            </h3>

          </div>


          <div className="profile-box">

            <span>
              Email
            </span>

            <h3>
              {user?.email || "N/A"}
            </h3>

          </div>


          <div className="profile-box">

            <span>
              Role
            </span>

          <h3>
  {role}
</h3>

          </div>

        </div>

      </div>

    </div>
  )
}
{
  showModal && (

    <div className="modal-overlay">

      <div className="modal">

        <div className="modal-header">

          <h2>
            Add Customer
          </h2>

          <span

            className="close-icon"

            onClick={() =>
              setShowModal(false)
            }
          >

            ✕

          </span>

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
                placeholder="Enter customer name"
                value={formData.name}
                onChange={handleChange}
                required
              />

            </div>


            {/* EMAIL */}

            <div className="input-group">

              <label>
                Email
              </label>

              <input
                type="email"
                name="email"
                placeholder="Enter email"
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
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
              />

            </div>


            {/* COMPANY */}

            <div className="input-group">

              <label>
                Company
              </label>

              <input
                type="text"
                name="company"
                placeholder="Enter company"
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
                value={
                  formData.leadStage
                }
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


            {/* PRIORITY */}

            <div className="input-group">

              <label>
                Priority
              </label>

              <select
                name="priority"
                value={
                  formData.priority
                }
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


            {/* INVESTMENT */}

         


            {/* SOURCE */}

            <div className="input-group">

              <label>
                Lead Source
              </label>

              <input
                type="text"
                name="source"
                placeholder="Enter source"
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
                placeholder="Assigned employee"
                value={
                  formData.assignedTo
                }
                onChange={handleChange}
              />

            </div>
{/* SOLUTION */}
<div className="form-group">

  <label>
    Solution
  </label>

  <select

    name="solution"

    value={formData.solution}

    onChange={handleChange}
  >

    <option value="">
      Select Solution
    </option>

    <option>
      Anti-Counterfeiting
    </option>

    <option>
      Track & Trace
    </option>

    <option>
      Customer Engagement
    </option>

    <option>
      Retail Intelligence
    </option>

    <option>
      Digital Warranty
    </option>

  </select>

</div>


{/* PRODUCT */}

<div className="form-group">

  <label>
    Product
  </label>

  <select

    name="product"

    value={formData.product}

    onChange={handleChange}
  >

    <option value="">
      Select Product
    </option>

    <option>
      Dealer Order Management
    </option>

    <option>
      AI Chatbot
    </option>

    <option>
      RFID Inventory management
    </option>

    <option>
      Custom Application Development
    </option>

  </select>

</div>

            {/* FOLLOWUP */}

            <div className="input-group">

              <label>
                Follow Up Date
              </label>

              <input
                type="date"
                name="followUpDate"
                value={
                  formData.followUpDate
                }
                onChange={handleChange}
              />

            </div>

          </div>


          {/* REMARK */}

          <div className="input-group">

            <label>
              Remarks
            </label>

            <textarea
              rows="4"
              name="remark"
              placeholder="Enter remarks"
              value={formData.remark}
              onChange={handleChange}
            ></textarea>

          </div>


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
{
  showEmployeeUpdate && (

    <div className="modal-overlay">

      <div className="modal">

        <div className="modal-header">

          <h2>
            Update Employee
          </h2>

          <span

            className="close-icon"

            onClick={() =>
              setShowEmployeeUpdate(false)
            }
          >

            ✕

          </span>

        </div>


        <form
          onSubmit={updateEmployee}
        >

          <div className="form-grid">

            {/* NAME */}

            <div className="input-group">

              <label>
                Name
              </label>

              <input

                type="text"

                value={
                  employeeForm.name
                }

                onChange={(e) =>

                  setEmployeeForm({

                    ...employeeForm,

                    name:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* EMAIL */}

            <div className="input-group">

              <label>
                Email
              </label>

              <input

                type="email"

                value={
                  employeeForm.email
                }

                onChange={(e) =>

                  setEmployeeForm({

                    ...employeeForm,

                    email:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* PASSWORD */}

            <div className="input-group">

              <label>
                Password
              </label>

              <input

                type="password"

                placeholder="
Leave empty if no change
"

                value={
                  employeeForm.password
                }

                onChange={(e) =>

                  setEmployeeForm({

                    ...employeeForm,

                    password:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* PHONE */}

            <div className="input-group">

              <label>
                Phone
              </label>

              <input

                type="text"

                value={
                  employeeForm.phone
                }

                onChange={(e) =>

                  setEmployeeForm({

                    ...employeeForm,

                    phone:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* DEPARTMENT */}

            <div className="input-group">

              <label>
                Department
              </label>

              <input

                type="text"

                value={
                  employeeForm.department
                }

                onChange={(e) =>

                  setEmployeeForm({

                    ...employeeForm,

                    department:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* DESIGNATION */}

            <div className="input-group">

              <label>
                Designation
              </label>

              <input

                type="text"

                value={
                  employeeForm.designation
                }

                onChange={(e) =>

                  setEmployeeForm({

                    ...employeeForm,

                    designation:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* SALARY */}

            <div className="input-group">

              <label>
                Salary
              </label>

              <input

                type="number"

                value={
                  employeeForm.salary
                }

                onChange={(e) =>

                  setEmployeeForm({

                    ...employeeForm,

                    salary:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* JOINING DATE */}

            <div className="input-group">

              <label>
                Joining Date
              </label>

              <input

                type="date"

                value={
                  employeeForm.joiningDate
                }

                onChange={(e) =>

                  setEmployeeForm({

                    ...employeeForm,

                    joiningDate:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* PROFILE IMAGE */}

            <div className="input-group">

              <label>
                Profile Image
              </label>

              <input

                type="file"

                onChange={(e) =>

                  setEmployeeForm({

                    ...employeeForm,

                    profileImage:
                    e.target.files[0],
                  })
                }
              />

            </div>


            {/* DOCUMENTS */}

            <div className="input-group">

              <label>
                Documents
              </label>

              <input

                type="file"

                multiple

                onChange={(e) =>

                  setEmployeeForm({

                    ...employeeForm,

                    documents:
                    e.target.files,
                  })
                }
              />

            </div>

          </div>


          <button
            type="submit"
            className="submit-btn"
          >

            Update Employee

          </button>

        </form>

      </div>

    </div>
  )
}

{
  showCustomerUpdate && (

    <div className="modal-overlay">

      <div className="modal">

        <div className="modal-header">

          <h2>
            Update Customer
          </h2>

          <span

            className="close-icon"

            onClick={() =>
              setShowCustomerUpdate(false)
            }
          >

            ✕

          </span>

        </div>


        <form
          onSubmit={updateCustomer}
        >

          <div className="form-grid">


            {/* NAME */}

            <div className="input-group">

              <label>
                Customer Name
              </label>

              <input

                type="text"

                value={formData.name}

                onChange={(e) =>

                  setFormData({

                    ...formData,

                    name:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* EMAIL */}

            <div className="input-group">

              <label>
                Email
              </label>

              <input

                type="email"

                value={formData.email}

                onChange={(e) =>

                  setFormData({

                    ...formData,

                    email:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* PHONE */}

            <div className="input-group">

              <label>
                Phone
              </label>

              <input

                type="text"

                value={formData.phone}

                onChange={(e) =>

                  setFormData({

                    ...formData,

                    phone:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* COMPANY */}

            <div className="input-group">

              <label>
                Company
              </label>

              <input

                type="text"

                value={formData.company}

                onChange={(e) =>

                  setFormData({

                    ...formData,

                    company:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* LEAD STAGE */}

            <div className="input-group">

              <label>
                Lead Stage
              </label>

              <select

                value={formData.leadStage}

                onChange={(e) =>

                  setFormData({

                    ...formData,

                    leadStage:
                    e.target.value,
                  })
                }
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


            {/* PRIORITY */}

            <div className="input-group">

              <label>
                Priority
              </label>

              <select

                value={formData.priority}

                onChange={(e) =>

                  setFormData({

                    ...formData,

                    priority:
                    e.target.value,
                  })
                }
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


            {/* INVESTMENT */}

            


            {/* SOURCE */}

            <div className="input-group">

              <label>
                Lead Source
              </label>

              <input

                type="text"

                value={formData.source}

                onChange={(e) =>

                  setFormData({

                    ...formData,

                    source:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* ASSIGNED */}

            <div className="input-group">

              <label>
                Assigned To
              </label>

              <input

                type="text"

                value={formData.assignedTo}

                onChange={(e) =>

                  setFormData({

                    ...formData,

                    assignedTo:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* FOLLOWUP */}

            <div className="input-group">

              <label>
                Follow Up Date
              </label>

              <input

                type="date"

                value={formData.followUpDate}

                onChange={(e) =>

                  setFormData({

                    ...formData,

                    followUpDate:
                    e.target.value,
                  })
                }
              />

            </div>

          </div>


          {/* REMARK */}

          <div className="input-group">

            <label>
              Remark
            </label>

            <textarea

              rows="4"

              value={formData.remark}

              onChange={(e) =>

                setFormData({

                  ...formData,

                  remark:
                  e.target.value,
                })
              }
            ></textarea>

          </div>


          <button
            type="submit"
            className="submit-btn"
          >

            Update Customer

          </button>

        </form>

      </div>

    </div>
  )
}
{
  showStatusModal && (

    <div className="modal-overlay">

      <div className="modal small-modal">

        <div className="modal-header">

          <h2>
            Update Lead Status
          </h2>

          <span

            className="close-icon"

            onClick={() =>
              setShowStatusModal(false)
            }
          >

            ✕

          </span>

        </div>


        <form
          onSubmit={saveStatusUpdate}
        >

          {/* LEAD STAGE */}

          <div className="input-group">

            <label>
              Lead Stage
            </label>

            <select

              value={formData.leadStage}

              onChange={(e) =>

                setFormData({

                  ...formData,

                  leadStage:
                  e.target.value,
                })
              }
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


          {/* STATUS */}

          <div className="input-group">

            <label>
              Customer Status
            </label>

            <select

              value={formData.status}

              onChange={(e) =>

                setFormData({

                  ...formData,

                  status:
                  e.target.value,
                })
              }
            >

              <option value="lead">

                Lead

              </option>

              <option value="customer">

                Customer

              </option>

              <option value="lost">

                Lost

              </option>

            </select>

          </div>


          <button
            type="submit"
            className="submit-btn"
          >

            Update Status

          </button>

        </form>

      </div>

    </div>
  )
}
{
  showCustomerDetails &&
  selectedCustomer && (

    <div className="modal-overlay">

      <div className="modal">

        <div className="modal-header">

          <h2>
            Customer Details
          </h2>

          <span

            className="close-icon"

            onClick={() =>
              setShowCustomerDetails(false)
            }
          >

            ✕

          </span>

        </div>


        <div className="customer-detail-wrapper">

          <div className="detail-row">

            <span>Name</span>

            <h4>
              {selectedCustomer.name}
            </h4>

          </div>


          <div className="detail-row">

            <span>Company</span>

            <h4>
              {selectedCustomer.company}
            </h4>

          </div>


          <div className="detail-row">

            <span>Email</span>

            <h4>
              {selectedCustomer.email}
            </h4>

          </div>


          <div className="detail-row">

            <span>Phone</span>

            <h4>
              {selectedCustomer.phone}
            </h4>

          </div>


          <div className="detail-row">

            <span>Lead Stage</span>

            <h4>
              {selectedCustomer.leadStage}
            </h4>

          </div>


          <div className="detail-row">

            <span>Priority</span>

            <h4>
              {selectedCustomer.priority}
            </h4>

          </div>
       


          <div className="detail-row">

            <span>Assigned To</span>

            <h4>
              {selectedCustomer.assignedTo}
            </h4>

          </div>


          <div className="detail-row">

            <span>Follow Up</span>

            <h4>

              {
                selectedCustomer
                ?.followUpDate
                ?.slice(0, 10)
              }

            </h4>

          </div>
          <div className="view-box">

  <span>
    Solution
  </span>

  <h4>
    {selectedCustomer.solution}
  </h4>

</div>


<div className="view-box">

  <span>
    Product
  </span>

  <h4>
    {selectedCustomer.product}
  </h4>

</div>


<div className="view-box">

  <span>
    Last Modified
  </span>

  <h4>

    {
      selectedCustomer.lastModified

      ? new Date(
          selectedCustomer.lastModified
        ).toLocaleString()

      : "N/A"
    }

  </h4>

</div>


          <div className="detail-row full-row">

            <span>Remark</span>

            <h4>
              {
                selectedCustomer.remark
              }
            </h4>

          </div>
          <div className="view-box full-width">

  <span>
    Previous Remarks
  </span>

  {

    selectedCustomer
    ?.lastRemarks
    ?.length > 0 ? (

      selectedCustomer
      .lastRemarks
      .map((item, index) => (

        <div
          key={index}
          className="
remark-history
"
        >

          <p>

            {item.remark}

          </p>

          <small>

            {
              new Date(
                item.updatedAt
              ).toLocaleString()
            }

          </small>

        </div>
      ))

    ) : (

      <p>
        No previous remarks
      </p>
    )
  }

</div>

        </div>


      <div className="customer-action-buttons">

  <button

    className="update-customer-btn"

    onClick={() => {

      setShowCustomerDetails(false);

      handleFullUpdate(
        selectedCustomer
      );
    }}
  >

    Update Customer

  </button>


  <button

    className="delete-customer-btn"

    onClick={() =>

  deleteCustomer(
    selectedCustomer
  )
}
  >

    Delete Customer

  </button>

</div>

      </div>

    </div>
  )
}

      </div>
   

    </div>
  );
};

export default Dashboard;
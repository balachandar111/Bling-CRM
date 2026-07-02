// 📁 src/pages/Dashboard.jsx


import React,
{
  useEffect,
  useState,
} from "react";
import Calendar from "react-calendar";

import API from "../services/api";

import * as XLSX from "xlsx";

import { saveAs }
from "file-saver";
import "react-calendar/dist/Calendar.css";

import EmployeeAttendanceModal from "../components/EmployeeAttendanceModal";
import "../components/EmployeeAttendanceModal.css";

// Admin-only sections
import Employees from "../admin/Employees";
import UserManagement from "../admin/UserManagement";
import LeaveRequests from "../admin/LeaveRequests";

// User-only sections
import MyAttendance from "../user/MyAttendance";
import MyProfile from "../user/MyProfile";
import Tasks from "../user/Tasks";

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
  FaHistory,
  FaClock,
  FaChartLine,
  FaMoneyBillWave,
  FaUserCheck,
  FaTasks,
  FaPlus,
FaSignOutAlt,
FaUserCircle,
  FaEdit,
  FaTrash,
  FaSyncAlt,
FaSync,
FaCalendarAlt,

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

const [sidebarOpen,
setSidebarOpen] =
useState(true);
const uploadPayslip =
async ()=>{

 try{

  const formData =
  new FormData();

  const [year, month] =
  payslipData.month.split("-");

  formData.append(
   "month",
   month
  );

  formData.append(
   "year",
   year
  );

  formData.append(

   "payslip",

   payslipData.file

  );

  await API.put(

   `/employees/upload-payslip/${selectedEmployee._id}`,

   formData,

   {

    headers:{

     "Content-Type":
     "multipart/form-data"

    }

   }

  );

  alert(
   "Payslip Uploaded Successfully"
  );

  setShowPayslipModal(false);

  fetchEmployees();

 }catch(error){

  console.log(error);

  alert(

   error.response?.data?.message ||

   "Upload Failed"

  );

 }

};


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
      "User Created Successfully. An employee profile has been auto-created for this user."
    );

    fetchUsers();
    fetchEmployees(); // user now also appears in employee list

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

  createUserAccount: false,
});
const handleEmployeeChange =
(e) => {

  const { name, value, type, checked } =
    e.target;

  setEmployeeForm({

    ...employeeForm,

    [name]: type === "checkbox" ? checked : value,
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

    formData.append(
      "createUserAccount",
      employeeForm.createUserAccount ? "true" : "false"
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
      data.linkedUser
        ? "Employee Added Successfully. A User login was also created with the same email/password."
        : data.userCreationWarning
        ? `Employee Added Successfully. ${data.userCreationWarning}`
        : "Employee Added Successfully"
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
const downloadExcel = () => {

  // FILTERED DATA

  const excelData =
  filteredCustomers.map(
    (customer) => ({

      Name:
      customer.name,

      Email:
      customer.email,

      "Contact No":
      customer.phone,

      Company:
      customer.company,

      Status:
      customer.status,

      LeadStage:
      customer.leadStage,

      Priority:
      customer.priority,


      Product:
      customer.product,
      Sector:
      customer.sector,

 
      Source:
      customer.source,

      AssignedTo:
      customer.assignedTo,

      FollowUp:
      customer.followUpDate
      ?.slice(0, 10),

      LastModified:
      customer.lastModified

      ? new Date(
          customer.lastModified
        ).toLocaleString()

      : "N/A",

      Remark:
      customer.remark,
    })
  );


  // WORKSHEET

  const worksheet =
  XLSX.utils.json_to_sheet(
    excelData
  );


  // WORKBOOK

  const workbook =
  XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(

    workbook,

    worksheet,

    "Customers"
  );


  // BUFFER

  const excelBuffer =
  XLSX.write(workbook, {

    bookType: "xlsx",

    type: "array",
  });


  // FILE

  const fileData =
  new Blob(

    [excelBuffer],

    {

      type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  );


  saveAs(

    fileData,

    "Customer_Details.xlsx"
  );
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

const [showPayslipModal,
setShowPayslipModal] =
useState(false);

const [payslipData,
setPayslipData] =
useState({

 month:"",

 file:null

});
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
const [showUpdatedPopup,
setShowUpdatedPopup] =
useState(false);

const [popupType,
setPopupType] =
useState("today");

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


const updatedTodayCustomers =
customers.filter((customer) => {

  if (!customer.lastModified)
    return false;

  const diffHours =
    (Date.now() -
      new Date(
        customer.lastModified
      )) /
    (1000 * 60 * 60);

  return diffHours <= 24;

});

const updatedToday =
updatedTodayCustomers.length;
const updatedWeekCustomers =
customers.filter((customer) => {

  if (!customer.lastModified)
    return false;

  const diffDays =
    (Date.now() -
      new Date(
        customer.lastModified
      )) /
    (1000 * 60 * 60 * 24);

  return diffDays <= 7;

});

const updatedWeek =
updatedWeekCustomers.length;

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
const [sourceFilter,setSourceFilter] = useState("");

const [sectorFilter,setSectorFilter] = useState("");

const [assignedToFilter,setAssignedToFilter] = useState("");


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
useEffect(() => {

const fullScreenPages = [
  "customers",
  "dashboard",
  "users",
  "employees",
  "reminders",
  "MyAttendance",
  "myProfile",
];

  setSidebarOpen(
    !fullScreenPages.includes(
      activeMenu
    )
  );

}, [activeMenu]);
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
const [showExcelModal, setShowExcelModal] = useState(false);
const [selectedUserFilter, setSelectedUserFilter] = useState("");
const filteredUsers =
users.filter((user) =>

  user.name
  .toLowerCase()

  .includes(

    userSearch
    .toLowerCase()
  )
);

// ================= ASSIGNABLE USERS (for "Assigned To") =================
// Combine users + employees (whichever the current role can see) into a
// single, de-duplicated list of names to populate the "Assigned To"
// dropdown and the admin panel filter.
const assignableUsers = React.useMemo(() => {

  const names = [
    ...users.map((u) => u.name),
    ...employees.map((e) => e.name),
  ].filter(Boolean);

  return Array.from(new Set(names)).sort((a, b) =>
    a.localeCompare(b)
  );

}, [users, employees]);


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

const [showAttendanceModal, setShowAttendanceModal] = useState(false);
const [attendanceEmployee, setAttendanceEmployee] = useState(null);



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
const matchesSource =
  !sourceFilter ||
  customer.source
    ?.toLowerCase()
    .includes(sourceFilter.toLowerCase());

const matchesSector =
  !sectorFilter ||
  customer.sector
    ?.toLowerCase()
    .includes(sectorFilter.toLowerCase());

// ASSIGNED TO
const matchesAssignedTo =
  !assignedToFilter ||
  customer.assignedTo === assignedToFilter;

 return (
  matchesSearch &&
  matchesSolution &&
  matchesProduct &&
  matchesPriority &&
  matchesStatus &&
  matchesSource &&
  matchesSector &&
  matchesAssignedTo
);
});

  const [formData, setFormData] =
useState({

  name: "",
  email: "",
  phone: "",
  company: "",
  sector: "",

  status: "lead",
  leadStage: "Awareness",

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


  // ================= LEAVE REQUESTS (SUPER ADMIN) =================

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [leaveActionLoading, setLeaveActionLoading] = useState(false);

  const fetchPendingLeaves = async () => {
    try {
      const { data } = await API.get("/attendance/leave/pending");
      setPendingLeaves(data.records || []);
      setPendingLeaveCount((data.records || []).length);
    } catch (error) {
      console.log(error);
    }
  };

  const approveLeaveRequest = async (id) => {
    if (!window.confirm("Approve this leave request? It will be marked as leave.")) return;
    setLeaveActionLoading(true);
    try {
      await API.put(`/attendance/leave/${id}/approve`);
      alert("Leave approved and marked as leave.");
      fetchPendingLeaves();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to approve leave");
    }
    setLeaveActionLoading(false);
  };

  const rejectLeaveRequest = async (id) => {
    if (!window.confirm("Reject this leave request?")) return;
    setLeaveActionLoading(true);
    try {
      await API.put(`/attendance/leave/${id}/reject`);
      alert("Leave request rejected.");
      fetchPendingLeaves();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to reject leave");
    }
    setLeaveActionLoading(false);
  };

  useEffect(() => {

   fetchCustomers();

fetchEmployees();

if (role === "super_admin") {
  fetchUsers();
  fetchPendingLeaves();
  // Auto-migrate existing users → linked employee records (idempotent)
  API.post("/users/migrate-employees").catch(() => {});
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
    console.log("Sending Data =>", formData);

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

    

        remark: "",

        followUpDate: "",

        priority: "Medium",

        source: "Website",

        sector: "",
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
    sector: customer.sector || "",
    product:customer.product || "",

    remark: customer.remark || "",

   

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
        response.data?.message ||
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
<div
  className={`sidebar ${
    sidebarOpen
      ? ""
      : "sidebar-hidden"
  }`}
>

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
{
  role === "super_admin" && (
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
  )
}

  {/* ATTENDANCE - USER PANEL ONLY (user is also an employee:
      check in/out, leave, payslips, attendance history) */}


  {/* ATTENDANCE - USER / EMPLOYEE ONLY (removed for admin) */}
{
  role !== "super_admin" && (
<li

  className={
    activeMenu ===
    "MyAttendance"

      ? "active"

      : ""
  }

  onClick={() =>
    setActiveMenu(
      "MyAttendance"
    )
  }
>

  <FaClock />

  Attendance

</li>
  )
}

  {/* TASKS - visible to everyone */}
<li

  className={
    activeMenu === "tasks"
      ? "active"
      : ""
  }

  onClick={() => setActiveMenu("tasks")}
>

  <FaTasks />

  Tasks

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

  {/* LEAVE REQUESTS - SUPER ADMIN ONLY */}
  {
    role ===
    "super_admin" && (

      <li

        className={
          activeMenu ===
          "leaveRequests"

            ? "active"

            : ""
        }

        onClick={() =>
          setActiveMenu(
            "leaveRequests"
          )
        }
      >

        <FaCalendarAlt />

        Leave Requests
        {pendingLeaveCount > 0 && (
          <span
            style={{
              marginLeft: "8px",
              background: "#ff4d4f",
              color: "#fff",
              borderRadius: "10px",
              padding: "1px 8px",
              fontSize: "12px",
            }}
          >
            {pendingLeaveCount}
          </span>
        )}

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

   <div
  className={`main-content ${
    !sidebarOpen
      ? "main-expanded"
      : ""
  }`}
>



        {/* ================= DASHBOARD ================= */}

        {
          activeMenu ===
          "dashboard" && (

            <>

              {/* TOPBAR */}

              <div className="topbar">

                <div>
                  <div className="dash">
                   <button
      className="sidebar-toggle"
      onClick={() =>
        setSidebarOpen(prev => !prev)
      }
    >
      ☰
    </button>

                  <h1 className="dh1">
                    CRM Analytics Dashboard
                  </h1>

                  <p className="p1">
                    Sales &
                    Customer Insights
                  </p>
   <div className="action-buttons">
          
            </div>      
                  
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
<div
  className="stat-card clickable-card"
  onClick={() => {

    setPopupType("today");

    setShowUpdatedPopup(true);

  }}
>

  <div>

    <h4>
      Updated (24 Hrs)
    </h4>

    <h2>
      {updatedToday}
    </h2>

  </div>

  <FaHistory
    className="icon red"
  />

</div>
<div
  className="stat-card clickable-card"
  onClick={() => {

    setPopupType("week");

    setShowUpdatedPopup(true);

  }}
>

  <div>

    <h4>
      Updated (7 Days)
    </h4>

    <h2>
      {updatedWeek}
    </h2>

  </div>

  <FaClock
    className="icon blue"
  />

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


  <div className="header-left">

    <button
      className="sidebar-toggle"
      onClick={() =>
        setSidebarOpen(prev => !prev)
      }
    >
      ☰
    </button>

    <div>

      <h2 className="page-title">
        Customer Management
      </h2>

      <p className="page-subtitle">
        Manage customer records
      </p>

    </div>

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
          <button
            className="bulk-upload-btn"
            onClick={() => setShowExcelModal(true)}
          >
            📤 Upload Excel
          </button>

        </div>

      </div>
<div className="customer-filters">

  


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
      Bling Rewards
    </option>
     <option>
      Digital Warranty
    </option>
    <option>
      Track and Trace
    </option>

    <option>
     Dealer Module
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
  <div className="filter-item">

  <label>
    Lead Source
  </label>

  <select
    value={sourceFilter}
    onChange={(e)=>
      setSourceFilter(e.target.value)
    }
  >

    <option value="">
      All Sources
    </option>

    <option value="Website">
      Website
    </option>

    <option value="Referral">
      Referral
    </option>
    <option value="Expo">
      Expo
    </option>

    <option value="Social media">
      Social Media
    </option>

  </select>

</div>
<div className="filter-item">

  <label>
    Sector
  </label>

  <input
    type="text"
    placeholder="Search sector..."
    value={sectorFilter}
    onChange={(e)=>
      setSectorFilter(e.target.value)
    }
  />

</div>
<div className="filter-item">

  <label>
    Assigned To
  </label>

  <select
    value={assignedToFilter}
    onChange={(e)=>
      setAssignedToFilter(e.target.value)
    }
  >

    <option value="">
      All Users
    </option>

    {assignableUsers.map(
      (name) => (
        <option
          key={name}
          value={name}
        >
          {name}
        </option>
      )
    )}

  </select>

</div>

{role === "super_admin" && (
  <div className="filter-item">
    <label>Filter by User</label>
    <select
      value={selectedUserFilter}
      onChange={(e) => {
        setSelectedUserFilter(e.target.value);
        filterByUser(e.target.value);
      }}
    >
      <option value="">All Users</option>
      {users.map((u) => (
        <option key={u._id} value={u._id}>{u.name}</option>
      ))}
    </select>
  </div>
)}
<button
  className="clear-filter-btn"
  onClick={() => {

    setProductFilter("");
    setPriorityFilter("");
    setStatusFilter("");
    setSourceFilter("");
    setSectorFilter("");
    setAssignedToFilter("");

  }}
>

  Clear Filters

</button>
<button
  className="download-btn"
  onClick={downloadExcel}
>
  📥 Download Excel
</button>
</div>



      {/* EXCEL UPLOAD MODAL */}
{showExcelModal && (
  <div className="modal-overlay" onClick={() => setShowExcelModal(false)}>
    <div className="excel-modal" onClick={(e) => e.stopPropagation()}>
      <div className="excel-modal-header">
        <h2>📊 Excel Customer Management</h2>
        <button className="adm-close-btn" onClick={() => setShowExcelModal(false)}>✕</button>
      </div>
      <div className="excel-modal-body">
        {/* Download Template */}
        <div className="excel-modal-card">
          <div className="excel-modal-icon">📥</div>
          <div>
            <h3>Download Template</h3>
            <p>Get the Excel template with all required column headers. Fill in your customer data and upload it back.</p>
          </div>
          <button
            className="excel-dl-btn"
            onClick={() => {
              const template = [{ name: "", email: "", "phone": "", company: "", status: "", leadStage: "", priority: "", source: "", assignedTo: "", product: "", sector: "",followUpDate: "", remark: "" }];
              const ws = XLSX.utils.json_to_sheet(template);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Customers");
              const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
              saveAs(new Blob([buf], { type: "application/octet-stream" }), "Customer_Template.xlsx");
            }}
          >
            Download Template
          </button>
        </div>

        <div className="excel-modal-divider"><span>OR</span></div>

        {/* Upload Excel */}
        <div className="excel-modal-card">
          <div className="excel-modal-icon">📤</div>
          <div>
            <h3>Upload Customer Data</h3>
            <p>Upload a filled Excel file (.xlsx / .xls / .csv) to bulk-create customers. Make sure columns match the template.</p>
          </div>
          <label className="excel-ul-btn">
            Upload Excel
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => {
                handleFileUpload(e);
                setShowExcelModal(false);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  </div>
)}

{/* TABLE */}

    <div className="customer-table-container">

        <table className="minimal-table">

          <thead>

            <tr>

              <th>Name</th>

              <th>Company</th>

              <th>Contact no</th>

               <th>Lead Source</th>
          
              <th>Product</th>
              <th>Sector</th>

             
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
  {customer.source}
</td>
<td>
  {customer.product || "-"}
</td>
<td>
  {customer.sector}
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
  className="action-icons"
  onClick={(e) =>
    e.stopPropagation()
  }
>

  {/* EDIT */}

  <button
    className="icon-btn edit-icon"
    title="Edit Customer"
    onClick={() =>
      handleFullUpdate(customer)
    }
  >
    <FaEdit />
  </button>

  {/* STATUS */}

  <button
    className="icon-btn status-icon"
    title="Update Status"
    onClick={() =>
      handleStatusUpdate(customer)
    }
  >
    <FaSyncAlt />
  </button>

  {/* DELETE */}

  <button
    className="icon-btn delete-icon"
    title="Delete Customer"
    onClick={() =>
      deleteCustomer(customer)
    }
  >
    <FaTrash />
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

         <div className="header-left">

    <button
      className="sidebar-toggle"
      onClick={() =>
        setSidebarOpen(prev => !prev)
      }
    >
      ☰
    </button>

          <h1 className="rh1">
            Follow Up Reminders
          </h1>

         

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

        {/* ================= MY ATTENDANCE (USER SELF-SERVICE) =================
            Gives a logged-in User (whose account email matches an Employee
            record) the full set of employee features: check-in/out, leave
            request, attendance history, and payslip downloads. */}

      {
  activeMenu === "MyAttendance" && role !== "super_admin" && (
    <MyAttendance setSidebarOpen={setSidebarOpen} />
  )
}
      {activeMenu === "myProfile" && role !== "super_admin" && (
        <MyProfile />
      )}

        {/* ================= EMPLOYEES ================= */}

      {
  role === "super_admin" && activeMenu === "employees" && (

    <Employees
            employees={employees} role={role} fetchEmployees={fetchEmployees}
            handleEmployeeUpdate={handleEmployeeUpdate} setSelectedEmployee={setSelectedEmployee}
            setSidebarOpen={setSidebarOpen}
            employeeForm={employeeForm} setEmployeeForm={setEmployeeForm}
            handleEmployeeChange={handleEmployeeChange} handleEmployeeFiles={handleEmployeeFiles}
            addEmployee={addEmployee} showEmployeeModal={showEmployeeModal} setShowEmployeeModal={setShowEmployeeModal}
            attendanceEmployee={attendanceEmployee} setAttendanceEmployee={setAttendanceEmployee}
            showAttendanceModal={showAttendanceModal} setShowAttendanceModal={setShowAttendanceModal}
            payslipData={payslipData} setPayslipData={setPayslipData}
            showPayslipModal={showPayslipModal} setShowPayslipModal={setShowPayslipModal} uploadPayslip={uploadPayslip}
            showEmployeeUpdate={showEmployeeUpdate} setShowEmployeeUpdate={setShowEmployeeUpdate} updateEmployee={updateEmployee}
          />
  )
}
        

        {/* ================= USER MANAGEMENT ================= */}

{
  activeMenu ===
  "users" &&

  role ===
  "super_admin" && (

    <UserManagement
            users={users} fetchUsers={fetchUsers} handleEditUser={handleEditUser} setSidebarOpen={setSidebarOpen}
            editUserForm={editUserForm} setEditUserForm={setEditUserForm}
            showEditUserModal={showEditUserModal} setShowEditUserModal={setShowEditUserModal} updateUserData={updateUserData}
            userForm={userForm} handleUserChange={handleUserChange} createUser={createUser}
            showUserModal={showUserModal} setShowUserModal={setShowUserModal}
          />
  )
}



{
  activeMenu === "leaveRequests" &&
  role === "super_admin" && (

    <LeaveRequests
            pendingLeaves={pendingLeaves} leaveActionLoading={leaveActionLoading}
            fetchPendingLeaves={fetchPendingLeaves} approveLeaveRequest={approveLeaveRequest}
            rejectLeaveRequest={rejectLeaveRequest} setSidebarOpen={setSidebarOpen}
          />
  )
}

{/* ================= TASKS / DAILY REPORTS ================= */}
{
  activeMenu === "tasks" && (
    <Tasks role={role} setSidebarOpen={setSidebarOpen} />
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
          


            {/* PHONE */}

            <div className="input-group">

              <label>
               Contact No
              </label>

              <input
                type="text"
                name="phone"
                placeholder="Enter Contact No"
                value={formData.phone}
                onChange={handleChange}
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
  <label>Lead Source</label>

  <select
    name="source"
    value={formData.source}
    onChange={handleChange}
  >
    <option value="Website">Website</option>
    <option value="Referral">Referral</option>
    <option value="Expo">Expo</option>
    <option value="Social Media">Social Media</option>
  
  </select>
</div>



            {/* ASSIGNED */}

            <div className="input-group">

              <label>
                Assigned To
              </label>

              <select
                name="assignedTo"
                value={
                  formData.assignedTo
                }
                onChange={handleChange}
              >
                <option value="">
                  Unassigned (defaults to you)
                </option>

                {assignableUsers.map(
                  (name) => (
                    <option
                      key={name}
                      value={name}
                    >
                      {name}
                    </option>
                  )
                )}
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
      Bling Rewards
    </option>
     <option>
      Digital Warranty
    </option>
    <option>
      Track and Trace
    </option>

    <option>
     Dealer Module
    </option>

    <option>
      Custom Application Development
    </option>

  </select>

</div>
<div className="input-group">

              <label>
                Sector
              </label>

              <input
                type="text"
                name="sector"
                placeholder="Enter sector"
                value={formData.sector}
                onChange={handleChange}
            
              />

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
                Contact No
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
            <div className="input-group">

  <label>
    Sector
  </label>

  <input
    type="text"
    name="sector"
    placeholder="Enter Sector"
    value={formData.sector}
    onChange={(e) =>

                  setFormData({

                    ...formData,

                    sector:
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
  <label>Lead Source</label>

  <select
    name="source"
    value={formData.source}
    onChange={handleChange}
  >
    <option value="Website">Website</option>
    <option value="Referral">Referral</option>
    <option value="Expo">Expo</option>
    <option value="Social media">Social Media</option>
    <option value="others">Others</option>
   
  </select>
</div>


            {/* ASSIGNED */}

            <div className="input-group">

              <label>
                Assigned To
              </label>

              <select

                value={formData.assignedTo}

                onChange={(e) =>

                  setFormData({

                    ...formData,

                    assignedTo:
                    e.target.value,
                  })
                }
              >
                <option value="">
                  Unassigned (defaults to you)
                </option>

                {assignableUsers.map(
                  (name) => (
                    <option
                      key={name}
                      value={name}
                    >
                      {name}
                    </option>
                  )
                )}
              </select>

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

            <span>Contact No</span>

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

            <span>Sector</span>

            <h4>
              {selectedCustomer.sector}
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
    selectedCustomer?.lastRemarks?.length > 0 ? (
      /* Show ALL remarks — no slice/limit */
      selectedCustomer.lastRemarks.map((item, index) => (
        <div key={index} className="remark-history">
          <p>{item.remark}</p>
          {/* Date only — no time */}
          <span className="remark-date">
            {new Date(item.updatedAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      ))
    ) : (
      <p>No previous remarks</p>
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
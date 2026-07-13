import React, { useState } from "react";
import API from "../services/api";
import { FaPlus } from "react-icons/fa";
import EmployeeAttendanceModal from "../components/EmployeeAttendanceModal";

const Employees = ({
  employees,
  role,
  fetchEmployees,
  handleEmployeeUpdate,
  setSelectedEmployee,
  setSidebarOpen,
  employeeForm,
  setEmployeeForm,
  handleEmployeeChange,
  handleEmployeeFiles,
  addEmployee,
  showEmployeeModal,
  setShowEmployeeModal,
  attendanceEmployee,
  setAttendanceEmployee,
  showAttendanceModal,
  setShowAttendanceModal,
  payslipData,
  setPayslipData,
  showPayslipModal,
  setShowPayslipModal,
  uploadPayslip,
  showEmployeeUpdate,
  setShowEmployeeUpdate,
  updateEmployee
}) => {

  // ================= GENERATE PAYSLIP (POPUP) =================
  // Self-contained: this button + modal don't touch any of the props
  // above — they call the payslip API directly, the same way the
  // Payslips sidebar page does.
  const now = new Date();
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const emptyPayslipForm = {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    effectiveWorkDays: 30,
    lop: 0,
    location: "",
    bankName: "",
    bankAccountNo: "",
    panNumber: "",
    pfNo: "",
    pfUan: "",
    designation: "",
    department: "",
    earnings: {
      basic: 0,
      hra: 0,
      conveyance: 0,
      specialAllowance: 0,
      communicationAllowance: 0,
      reimbursement: 0,
    },
    deductions: {
      profTax: 0,
      incomeTax: 0,
    },
  };

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateEmployee, setGenerateEmployee] = useState(null);
  const [generateForm, setGenerateForm] = useState(emptyPayslipForm);
  const [generateSaving, setGenerateSaving] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generatedPayslip, setGeneratedPayslip] = useState(null);
  const [generateSending, setGenerateSending] = useState(false);

  // Builds a sensible starting split from the employee's stored salary,
  // same approach the backend uses — the admin can edit every number
  // before generating.
  const defaultBreakupFor = (employee) => {
    const salary = Number(employee?.salary) || 0;
    const conveyance = salary > 0 ? 1600 : 0;
    const communicationAllowance = salary > 0 ? 1500 : 0;
    const basic = Math.round(salary * 0.5);
    const hra = Math.round(salary * 0.25);
    const reimbursement = 0;
    const specialAllowance = Math.max(
      0,
      salary - (basic + hra + conveyance + communicationAllowance + reimbursement)
    );

    let profTax = 0;
    if (salary > 75000) profTax = 1250;
    else if (salary > 45000) profTax = 810;
    else if (salary > 30000) profTax = 590;
    else if (salary > 21000) profTax = 235;

    return {
      earnings: { basic, hra, conveyance, specialAllowance, communicationAllowance, reimbursement },
      deductions: { profTax, incomeTax: 0 },
    };
  };

  const openGenerateModal = (employee) => {
    const defaults = defaultBreakupFor(employee);
    setGenerateEmployee(employee);
    setGeneratedPayslip(null);
    setGenerateError("");
    setGenerateForm({
      ...emptyPayslipForm,
      designation: employee.designation || "",
      department: employee.department || "",
      bankName: employee.bankName || "",
      bankAccountNo: employee.bankAccountNo || "",
      earnings: defaults.earnings,
      deductions: defaults.deductions,
    });
    setShowGenerateModal(true);
  };

  const closeGenerateModal = () => {
    setShowGenerateModal(false);
    setGenerateEmployee(null);
    setGeneratedPayslip(null);
    setGenerateError("");
  };

  const setGenerateField = (field, value) =>
    setGenerateForm((f) => ({ ...f, [field]: value }));

  const setGenerateEarning = (key, value) =>
    setGenerateForm((f) => ({ ...f, earnings: { ...f.earnings, [key]: value } }));

  const setGenerateDeduction = (key, value) =>
    setGenerateForm((f) => ({ ...f, deductions: { ...f.deductions, [key]: value } }));

  const generateTotalEarnings = Object.values(generateForm.earnings).reduce(
    (s, v) => s + (Number(v) || 0),
    0
  );
  const generateTotalDeductions = Object.values(generateForm.deductions).reduce(
    (s, v) => s + (Number(v) || 0),
    0
  );
  const generateNetPay = generateTotalEarnings - generateTotalDeductions;

  const submitGeneratePayslip = async () => {
    if (!generateEmployee) return;
    setGenerateSaving(true);
    setGenerateError("");
    try {
      const { data } = await API.post(
        `/payslips/employee/${generateEmployee._id}/generate`,
        generateForm
      );
      setGeneratedPayslip(data.payslip);
    } catch (err) {
      setGenerateError(err.response?.data?.message || "Failed to generate payslip");
    }
    setGenerateSaving(false);
  };

  const sendGeneratedPayslip = async () => {
    if (!generateEmployee || !generatedPayslip?._id) return;
    setGenerateSending(true);
    setGenerateError("");
    try {
      await API.put(
        `/payslips/employee/${generateEmployee._id}/${generatedPayslip._id}/send`
      );
      setGeneratedPayslip((p) => ({ ...p, status: "sent" }));
    } catch (err) {
      setGenerateError(err.response?.data?.message || "Failed to send payslip");
    }
    setGenerateSending(false);
  };

  return (
    <>
<div className="employee-page">

      {/* TOP HEADER */}

      <div className="employee-topbar">

       <div className="header-left">

    <button
      className="sidebar-toggle"
      onClick={() =>
        setSidebarOpen(
          prev => !prev
        )
      }
    >
      ☰
    </button>
    <div className="emp">

          <h1>
            Employee Management
          </h1>

          <p>
            Manage employee records
          </p>
</div>
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
               <th>Payslip</th>
               <th>Attendance</th>

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

                        <h4 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {employee.name}
                          {employee.isUserLinked && (
                            <span style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              background: "#eef2ff",
                              color: "#4f46e5",
                              border: "1px solid #c7d2fe",
                              borderRadius: "20px",
                              padding: "2px 8px",
                              letterSpacing: "0.5px",
                            }}>
                              👤 USER
                            </span>
                          )}
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
       {
role === "super_admin" && (

<button

 className="payslip-btn"

 onClick={()=>{

  setSelectedEmployee(
   employee
  );

  setShowPayslipModal(true);

 }}

>

 Upload Payslip

</button>

)
}
{
role === "super_admin" && (

<button

 className="payslip-btn"

 style={{ marginLeft: "6px" }}

 onClick={() => openGenerateModal(employee)}

>

 Generate Payslip

</button>

)
}</td>
<td>
  {role === "super_admin" && (
  <button
    className="att-view-btn"
    onClick={() => {
      setAttendanceEmployee(employee);
      setShowAttendanceModal(true);
    }}
  >
    📅 Attendance
  </button>
)}
</td>


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
{showEmployeeModal && (
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
                Contact No
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

            {/* ALSO CREATE USER LOGIN */}

            <div className="input-group" style={{ gridColumn: "1 / -1" }}>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 }}>

                <input
                  type="checkbox"
                  name="createUserAccount"
                  checked={employeeForm.createUserAccount}
                  onChange={handleEmployeeChange}
                />

                Also create a User login for this employee (same email &amp; password) — lets them check in/out, apply leave, and view payslips from the User Dashboard's Attendance section.

              </label>

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
)}
{showAttendanceModal && attendanceEmployee && (
  <EmployeeAttendanceModal
    employee={attendanceEmployee}
    onClose={() => {
      setShowAttendanceModal(false);
      setAttendanceEmployee(null);
    }}
  />
)}
{showPayslipModal && (
<div className="modal-overlay">

 <div className="modal">

  <h2>
   Upload Payslip
  </h2>

  <input

   type="month"

   onChange={(e)=>

   setPayslipData({

    ...payslipData,

    month:
    e.target.value

   })

   }
  />

  <input

   type="file"

   accept=".pdf"

   onChange={(e)=>

   setPayslipData({

    ...payslipData,

    file:
    e.target.files[0]

   })

   }
  />

  <button
   onClick={
    uploadPayslip
   }
  >

   Upload

  </button>

 </div>

</div>
)}
{showGenerateModal && generateEmployee && (
<div className="modal-overlay" onClick={closeGenerateModal}>
  <div
    className="modal"
    style={{ maxWidth: "640px", width: "95%", maxHeight: "88vh", overflowY: "auto" }}
    onClick={(e) => e.stopPropagation()}
  >
    <h2>
      Generate Payslip — {generateEmployee.name} ({MONTHS[generateForm.month - 1]} {generateForm.year})
    </h2>

    {generateError && (
      <div style={{ background: "#fdecea", color: "#c0392b", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px" }}>
        {generateError}
      </div>
    )}

    {!generatedPayslip ? (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
          <label>
            Month
            <select
              value={generateForm.month}
              onChange={(e) => setGenerateField("month", Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Year
            <input
              type="number"
              value={generateForm.year}
              onChange={(e) => setGenerateField("year", Number(e.target.value))}
            />
          </label>
          <label>
            Designation
            <input value={generateForm.designation} onChange={(e) => setGenerateField("designation", e.target.value)} />
          </label>
          <label>
            Department
            <input value={generateForm.department} onChange={(e) => setGenerateField("department", e.target.value)} />
          </label>
          <label>
            Location
            <input value={generateForm.location} onChange={(e) => setGenerateField("location", e.target.value)} />
          </label>
          <label>
            Effective Work Days
            <input
              type="number"
              value={generateForm.effectiveWorkDays}
              onChange={(e) => setGenerateField("effectiveWorkDays", e.target.value)}
            />
          </label>
          <label>
            LOP
            <input type="number" value={generateForm.lop} onChange={(e) => setGenerateField("lop", e.target.value)} />
          </label>
          <label>
            Bank Name
            <input value={generateForm.bankName} onChange={(e) => setGenerateField("bankName", e.target.value)} />
          </label>
          <label>
            Bank Account No
            <input value={generateForm.bankAccountNo} onChange={(e) => setGenerateField("bankAccountNo", e.target.value)} />
          </label>
          <label>
            PAN Number
            <input value={generateForm.panNumber} onChange={(e) => setGenerateField("panNumber", e.target.value)} />
          </label>
          <label>
            PF No
            <input value={generateForm.pfNo} onChange={(e) => setGenerateField("pfNo", e.target.value)} />
          </label>
          <label>
            PF UAN
            <input value={generateForm.pfUan} onChange={(e) => setGenerateField("pfUan", e.target.value)} />
          </label>
        </div>

        <h4>Earnings</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
          <label>
            Basic
            <input type="number" value={generateForm.earnings.basic} onChange={(e) => setGenerateEarning("basic", e.target.value)} />
          </label>
          <label>
            HRA
            <input type="number" value={generateForm.earnings.hra} onChange={(e) => setGenerateEarning("hra", e.target.value)} />
          </label>
          <label>
            Conveyance
            <input type="number" value={generateForm.earnings.conveyance} onChange={(e) => setGenerateEarning("conveyance", e.target.value)} />
          </label>
          <label>
            Special Allowance
            <input type="number" value={generateForm.earnings.specialAllowance} onChange={(e) => setGenerateEarning("specialAllowance", e.target.value)} />
          </label>
          <label>
            Communication Allowance
            <input type="number" value={generateForm.earnings.communicationAllowance} onChange={(e) => setGenerateEarning("communicationAllowance", e.target.value)} />
          </label>
         
        </div>

        <h4>Deductions</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
          <label>
            Professional Tax
            <input type="number" value={generateForm.deductions.profTax} onChange={(e) => setGenerateDeduction("profTax", e.target.value)} />
          </label>
          <label>
            Income Tax
            <input type="number" value={generateForm.deductions.incomeTax} onChange={(e) => setGenerateDeduction("incomeTax", e.target.value)} />
          </label>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 600,
            borderTop: "1px solid #eee",
            paddingTop: "10px",
            marginBottom: "16px",
          }}
        >
          <span>Total Earnings: {generateTotalEarnings.toLocaleString("en-IN")}</span>
          <span>Total Deductions: {generateTotalDeductions.toLocaleString("en-IN")}</span>
          <span>Net Pay: {generateNetPay.toLocaleString("en-IN")}</span>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={closeGenerateModal} disabled={generateSaving}>
            Cancel
          </button>
          <button className="payslip-btn" onClick={submitGeneratePayslip} disabled={generateSaving}>
            {generateSaving ? "Generating..." : "Generate Payslip"}
          </button>
        </div>
      </>
    ) : (
      <div>
        <p style={{ color: "#1a9d5b", fontWeight: 600 }}>
          Payslip generated as a {generatedPayslip.status === "sent" ? "sent" : "draft"} — net pay{" "}
          {Number(generatedPayslip.netPay || 0).toLocaleString("en-IN")}.
        </p>
        <p style={{ color: "#777" }}>
          {generatedPayslip.status === "sent"
            ? "This payslip is now visible to the employee under My Payslips."
            : "It is saved as a draft and is not visible to the employee yet. Click Send when you're ready."}
        </p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
          {generatedPayslip.pdfUrl && (
            <a
              href={generatedPayslip.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="view-doc-btn"
            >
              View / Download PDF
            </a>
          )}

          {generatedPayslip.status !== "sent" && (
            <button className="payslip-btn" onClick={sendGeneratedPayslip} disabled={generateSending}>
              {generateSending ? "Sending..." : "Send to Employee"}
            </button>
          )}

          <button onClick={() => setGeneratedPayslip(null)}>
            Edit Again
          </button>

          <button onClick={closeGenerateModal}>
            Close
          </button>
        </div>
      </div>
    )}
  </div>
</div>
)}
{showEmployeeUpdate && (
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
)}
    </>
  );
};

export default Employees;
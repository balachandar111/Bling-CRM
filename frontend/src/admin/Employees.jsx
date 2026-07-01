import React from "react";
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
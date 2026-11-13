// 📁 src/pages/ReminderPage.jsx

import React, {
  useEffect,
  useState,
} from "react";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import {

  FaBell,

  FaPhoneAlt,

  FaBuilding,

  FaUserTie,

  FaEdit,

} from "react-icons/fa";

import API from "../services/api";

const ReminderPage = ({
  customers = [],
}) => {

  // ================= STATES =================

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [selectedCustomers,
    setSelectedCustomers] =
    useState([]);

  const [todayReminders,
    setTodayReminders] =
    useState([]);

  // ================= FORMAT DATE =================

  const formatDate = (date) => {

    return new Date(date)
      .toISOString()
      .split("T")[0];
  };

  // ================= TODAY REMINDERS =================

  useEffect(() => {

    const today =
      formatDate(new Date());

    const reminders =
      customers.filter(
        (customer) =>

          customer.followUpDate
            ?.slice(0, 10) === today
      );

    setTodayReminders(reminders);

  }, [customers]);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [sendWhatsAppOnUpdate, setSendWhatsAppOnUpdate] = useState(false);
  const [updateCustomerLoading, setUpdateCustomerLoading] = useState(false);

const [formData,
setFormData] =
useState({

  name: "",

  company: "",

  email: "",

  phone: "",

  leadStage: "",

  priority: "",

  assignedTo: "",

  followUpDate: "",

  source: "Website",

  remark: "",
});

// ================= HANDLE UPDATE =================

const handleUpdate =
(customer) => {

  setSelectedCustomer(
    customer
  );

  setFormData({

    name:
      customer.name || "",

    company:
      customer.company || "",

    email:
      customer.email || "",

    phone:
      customer.phone || "",

    leadStage:
      customer.leadStage || "",

    priority:
      customer.priority || "",

    source:
      customer.source || "Website",

    assignedTo:
      customer.assignedTo || "",

    followUpDate:
      customer.followUpDate
      ?.slice(0, 10) || "",

    remark:
      customer.remark || "",
  });

  setSendWhatsAppOnUpdate(false);
  setShowUpdateModal(true);
};


// ================= UPDATE CUSTOMER =================

const updateCustomer =
async (e) => {

  e.preventDefault();
  if (updateCustomerLoading) return;
  setUpdateCustomerLoading(true);

  try {

    const { data } =
      await API.put(
        `/customers/${selectedCustomer._id}`,
        {
          ...formData,
          sendWhatsApp: sendWhatsAppOnUpdate,
        }
      );

    if (data.success) {

      let message = "Customer Updated Successfully";
      if (sendWhatsAppOnUpdate) {
        message += data?.whatsapp?.sent
          ? "\nWhatsApp response message sent"
          : "\nWhatsApp message NOT sent: " + (data?.whatsapp?.error || "unknown error");
      }

      alert(message);

      setShowUpdateModal(false);

      window.location.reload();

    } else {

      alert(data.message);
    }

  } catch (error) {

    console.log(error);

    alert(error?.response?.data?.message || "Update Failed");
  } finally {
    setUpdateCustomerLoading(false);
  }
};

  // ================= SELECTED DATE FILTER =================

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

  // ================= BROWSER NOTIFICATION =================

  useEffect(() => {

    if (
      Notification.permission !==
      "granted"
    ) {

      Notification.requestPermission();
    }

    if (
      todayReminders.length > 0
    ) {

      new Notification(
        "CRM Reminder",
        {

          body:
            `You have ${todayReminders.length} follow-up(s) today`,
        }
      );
    }

  }, [todayReminders]);

  return (

    <div className="reminder-page">

      {/* HEADER */}

      <div className="reminder-header">

        <div>

          <h1>
            Follow Up Reminders
          </h1>

          <p>
            Track customer follow-ups
            by selecting a date
          </p>

        </div>

      </div>


      {/* TODAY ALERT */}

      {
        todayReminders.length > 0 && (

          <div className="today-alert">

            <FaBell />

            You have
            {" "}
            <strong>
              {
                todayReminders.length
              }
            </strong>
            {" "}
            follow-up(s) today

          </div>
        )
      }


      {/* MAIN GRID */}

      <div className="reminder-grid">


        {/* CALENDAR */}

        <div className="calendar-card">

          <h2>
            Select Follow Up Date
          </h2>

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

        <div className="customer-list-card">

          <div className="list-header">

            <h2>
              Customers Follow Up List
            </h2>

            <span className="selected-date">

              {
                selectedDate.toDateString()
              }

            </span>

          </div>


          {
            selectedCustomers.length === 0 ? (

              <div className="empty-state">

                No follow-ups found
                for this date

              </div>

            ) : (

              selectedCustomers.map(
                (customer) => (

                  <div

                    key={
                      customer._id
                    }

                    className="customer-card"
                  >

                    <div className="customer-left">

                      <h3>
                        {
                          customer.name
                        }
                      </h3>

                      <p>

                        <FaBuilding />

                        {
                          customer.company
                        }

                      </p>

                      <p>

                        <FaPhoneAlt />

                        {
                          customer.phone
                        }

                      </p>

                      <p>

                        <FaUserTie />

                        Assigned:
                        {" "}
                        {
                          customer.assignedTo
                        }

                      </p>

                    </div>

<button

  className="
update-customer-btn
"

  onClick={() =>
    handleUpdate(customer)
  }
>

  <FaEdit />

  Update

</button>
                    <div className="customer-right">

                      <span className="priority-badge">

                        {
                          customer.priority
                        }

                      </span>

                      <span className="stage-badge">

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

      {/* UPDATE MODAL */}
      {showUpdateModal && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Update Follow-up Customer</h2>
              <span
                className="close-icon"
                onClick={() => setShowUpdateModal(false)}
              >
                ✕
              </span>
            </div>

            <form onSubmit={updateCustomer}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="input-group">
                  <label>Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </div>

                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="input-group">
                  <label>Contact No</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="input-group">
                  <label>Lead Stage</label>
                  <select
                    value={formData.leadStage}
                    onChange={(e) =>
                      setFormData({ ...formData, leadStage: e.target.value })
                    }
                  >
                    <option value="">Select Stage</option>
                    <option value="Awareness">Awareness</option>
                    <option value="Interest">Interest</option>
                    <option value="Desire">Desire</option>
                    <option value="Action">Action</option>
                    <option value="Closure">Closure</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Lead Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) =>
                      setFormData({ ...formData, source: e.target.value })
                    }
                  >
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Expo">Expo</option>
                    <option value="Social Media">Social Media</option>
                    <option value="CITASIS">CITASIS</option>
                    <option value="YES">YES</option>
                    <option value="others">Others</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Follow Up Date</label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) =>
                      setFormData({ ...formData, followUpDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginTop: "12px" }}>
                <label>Remarks</label>
                <textarea
                  rows="3"
                  value={formData.remark}
                  onChange={(e) =>
                    setFormData({ ...formData, remark: e.target.value })
                  }
                ></textarea>
              </div>

              {/* SEND WHATSAPP RESPONSE MESSAGE OPTION */}
              <div
                className="input-group"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "16px",
                  marginBottom: "16px",
                }}
              >
                <input
                  type="checkbox"
                  id="reminderSendWhatsApp"
                  checked={sendWhatsAppOnUpdate}
                  onChange={(e) => setSendWhatsAppOnUpdate(e.target.checked)}
                  style={{ width: "auto", margin: 0, cursor: "pointer" }}
                />
                <label
                  htmlFor="reminderSendWhatsApp"
                  style={{ margin: 0, cursor: "pointer", fontWeight: "500", color: "#111827" }}
                >
                  Send WhatsApp response message to customer
                </label>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={updateCustomerLoading}
                style={{
                  opacity: updateCustomerLoading ? 0.7 : 1,
                  cursor: updateCustomerLoading ? "not-allowed" : "pointer",
                }}
              >
                {updateCustomerLoading ? "Updating Customer..." : "Update Customer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CSS */}

      <style>

        {`

        .reminder-page {
          padding: 25px;
          background: #F3F4F6;
          min-height: 100vh;
        }

        .reminder-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
        }

        .reminder-header p {
          color: #6B7280;
          margin-top: 6px;
        }

        .today-alert {
          margin-top: 20px;
          background: #FEF3C7;
          color: #92400E;
          padding: 15px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
        }

        .reminder-grid {
          margin-top: 25px;
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 25px;
        }

        .calendar-card,
        .customer-list-card {
          background: white;
          padding: 25px;
          border-radius: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        .calendar-card h2,
        .customer-list-card h2 {
          margin-bottom: 20px;
          color: #111827;
        }

        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }

        .react-calendar__tile {
          padding: 15px 0;
          border-radius: 10px;
        }

        .highlight-date {
          background: #2563EB !important;
          color: white !important;
          border-radius: 50%;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .selected-date {
          background: #2563EB;
          color: white;
          padding: 8px 15px;
          border-radius: 30px;
          font-size: 13px;
        }

        .customer-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #F9FAFB;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 18px;
          transition: 0.3s;
        }

        .customer-card:hover {
          transform: translateY(-3px);
        }

        .customer-left h3 {
          margin: 0;
          color: #111827;
        }

        .customer-left p {
          margin-top: 10px;
          color: #6B7280;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .customer-right {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: flex-end;
        }

        .priority-badge {
          background: #F59E0B;
          color: white;
          padding: 8px 14px;
          border-radius: 30px;
          font-size: 12px;
        }

        .stage-badge {
          background: #10B981;
          color: white;
          padding: 8px 14px;
          border-radius: 30px;
          font-size: 12px;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #9CA3AF;
          font-size: 18px;
        }

        @media(max-width: 900px) {

          .reminder-grid {
            grid-template-columns: 1fr;
          }
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          padding: 25px 30px;
          border-radius: 16px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          color: #111827;
        }

        .close-icon {
          font-size: 20px;
          cursor: pointer;
          color: #6B7280;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        .input-group input,
        .input-group select,
        .input-group textarea {
          padding: 9px 12px;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
        }

        .input-group input:focus,
        .input-group select:focus,
        .input-group textarea:focus {
          border-color: #2563EB;
        }

        .submit-btn {
          width: 100%;
          padding: 12px;
          background: #2563EB;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #1D4ED8;
        }

        `}
      </style>

    </div>
  );
};

export default ReminderPage;
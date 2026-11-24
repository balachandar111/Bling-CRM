const LeadTrack = require("../models/leadTrackModel");
const User = require("../models/userModel");
const Employee = require("../models/employeeModel");
const Customer = require("../models/customerModel");

// ================= HELPER: RESOLVE ALL CANDIDATE USER/EMPLOYEE IDS =================
const getCandidateUserIds = async (user) => {
  const ids = [];
  if (!user) return ids;

  if (user._id) ids.push(String(user._id));

  // If user object has linkedEmployeeId
  if (user.linkedEmployeeId) {
    const empId = user.linkedEmployeeId._id || user.linkedEmployeeId;
    if (empId) ids.push(String(empId));
  }

  try {
    const query = [];
    if (user._id) {
      query.push({ linkedEmployeeId: user._id });
    }
    if (user.email) {
      query.push({ email: user.email.toLowerCase().trim() });
    }

    if (query.length > 0) {
      const matchedUsers = await User.find({ $or: query }).select("_id email linkedEmployeeId");
      matchedUsers.forEach((u) => {
        ids.push(String(u._id));
        if (u.linkedEmployeeId) ids.push(String(u.linkedEmployeeId));
      });

      const matchedEmps = await Employee.find({ $or: query }).select("_id email");
      matchedEmps.forEach((e) => {
        ids.push(String(e._id));
      });
    }
  } catch (err) {
    console.warn("Candidate IDs lookup error:", err.message);
  }

  return [...new Set(ids)];
};

// ================= HELPER: CHECK TRACK ACCESS =================
const hasTrackAccess = (track, user, candidateIds = []) => {
  if (user.role === "super_admin") return true;

  const trackAssignedId = String(track.assignedTo?._id || track.assignedTo || "");
  if (candidateIds.includes(trackAssignedId)) return true;
  if (String(user._id) === trackAssignedId) return true;

  if (
    track.assignedToName &&
    user.name &&
    track.assignedToName.trim().toLowerCase() === user.name.trim().toLowerCase()
  ) {
    return true;
  }

  return false;
};

// ================= GET ASSIGNABLE USERS & EMPLOYEES (ADMIN ONLY) =================
exports.getAssignableUsers = async (req, res) => {
  try {
    const users = await User.find().select("name email role linkedEmployeeId");
    const employees = await Employee.find({ isActive: { $ne: false } }).select(
      "name email department designation"
    );

    const map = new Map();

    users.forEach((u) => {
      const emailKey = u.email ? u.email.toLowerCase().trim() : String(u._id);
      map.set(emailKey, {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role || "user",
        type: "user",
      });
    });

    employees.forEach((e) => {
      const emailKey = e.email ? e.email.toLowerCase().trim() : String(e._id);
      if (!map.has(emailKey)) {
        map.set(emailKey, {
          _id: e._id,
          name: e.name,
          email: e.email,
          role: e.designation || e.department || "Employee",
          type: "employee",
        });
      }
    });

    const assignable = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    res.status(200).json({
      success: true,
      count: assignable.length,
      users: assignable,
    });
  } catch (error) {
    console.error("Get Assignable Users Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= CREATE LEAD TRACK (ADMIN ONLY) =================
exports.createLeadTrack = async (req, res) => {
  try {
    const { assignedTo, startMonth, endMonth, title, products } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ success: false, message: "User is required" });
    }

    if (!startMonth || !endMonth) {
      return res.status(400).json({
        success: false,
        message: "Start month and End month are required",
      });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product with target must be selected",
      });
    }

    // Look up assigned user or employee
    let user = await User.findById(assignedTo).select("name email");
    if (!user) {
      user = await Employee.findById(assignedTo).select("name email");
    }
    if (!user) {
      return res.status(404).json({ success: false, message: "Assigned user or employee not found" });
    }

    // Validate products and targets
    const validProducts = [
      "Genunitys",
      "Rewards",
      "CRM",
      "Custom-Website",
      "WhatsappAtuomation",
      "Projects",
      "QuickCommerce",
    ];

    const formattedProducts = products.map((p) => {
      if (!validProducts.includes(p.productName)) {
        throw new Error(`Invalid product name: ${p.productName}`);
      }
      const isNoTarget = p.noTarget === true || p.noTarget === "true" || p.target === "no_target";
      return {
        productName: p.productName,
        target: isNoTarget ? 0 : Math.max(0, parseInt(p.target, 10) || 0),
        noTarget: isNoTarget,
        onboardedLeads: [],
      };
    });

    const leadTrack = await LeadTrack.create({
      assignedTo: user._id,
      assignedToName: user.name,
      startMonth,
      endMonth,
      title: title || `${user.name} - ${startMonth} to ${endMonth}`,
      products: formattedProducts,
      createdBy: req.user._id,
      createdByName: req.user.name || "Admin",
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Lead Track created successfully",
      leadTrack,
    });
  } catch (error) {
    console.error("Create LeadTrack Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET LEAD TRACKS =================
exports.getLeadTracks = async (req, res) => {
  try {
    const { userId, status, month } = req.query;
    const filter = {};

    const isAdmin = req.user.role === "super_admin";

    // Non-admin can ONLY view tracks assigned to them
    if (!isAdmin) {
      const candidateIds = await getCandidateUserIds(req.user);
      const orConditions = [{ assignedTo: { $in: candidateIds } }];
      if (req.user.name) {
        orConditions.push({
          assignedToName: { $regex: new RegExp(`^${req.user.name.trim()}$`, "i") },
        });
      }
      filter.$or = orConditions;
    } else if (userId && userId !== "all") {
      let targetUser = await User.findById(userId).select("_id email linkedEmployeeId name");
      if (!targetUser) {
        targetUser = await Employee.findById(userId).select("_id email name");
      }
      if (targetUser) {
        const candidateIds = await getCandidateUserIds(targetUser);
        const orConditions = [{ assignedTo: { $in: candidateIds } }];
        if (targetUser.name) {
          orConditions.push({
            assignedToName: { $regex: new RegExp(`^${targetUser.name.trim()}$`, "i") },
          });
        }
        filter.$or = orConditions;
      } else {
        filter.assignedTo = userId;
      }
    }

    if (status) {
      filter.status = status;
    }

    if (month) {
      const monthCondition = [{ startMonth: month }, { endMonth: month }];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: monthCondition }];
        delete filter.$or;
      } else {
        filter.$or = monthCondition;
      }
    }

    const tracks = await LeadTrack.find(filter)
      .populate("assignedTo", "name email phone")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Format with computed stats for cards
    const formattedTracks = tracks.map((track) => {
      const trackObj = track.toObject();
      let totalTarget = 0;
      let totalOnboarded = 0;
      let totalQuoted = 0;

      trackObj.products = trackObj.products.map((p) => {
        const quotedCount = p.onboardedLeads.filter((l) => l.stage === "Quote").length;
        const isNoTarget = !!p.noTarget;
        const remainingTarget = isNoTarget ? "No Target" : Math.max(0, (p.target || 0) - quotedCount);
        if (!isNoTarget) totalTarget += p.target || 0;
        totalOnboarded += p.onboardedLeads.length;
        totalQuoted += quotedCount;

        return {
          ...p,
          noTarget: isNoTarget,
          onboardedCount: p.onboardedLeads.length,
          quotedCount,
          remainingTarget,
          callCount: p.onboardedLeads.filter((l) => l.stage === "Call").length,
          whatsappCount: p.onboardedLeads.filter((l) => l.stage === "WhatsappMessage").length,
          demoCount: p.onboardedLeads.filter((l) => l.stage === "Demo").length,
        };
      });

      trackObj.totalTarget = totalTarget;
      trackObj.totalOnboarded = totalOnboarded;
      trackObj.totalQuoted = totalQuoted;
      trackObj.totalRemainingTarget = Math.max(0, totalTarget - totalQuoted);

      return trackObj;
    });

    res.status(200).json({
      success: true,
      count: formattedTracks.length,
      leadTracks: formattedTracks,
    });
  } catch (error) {
    console.error("Get LeadTracks Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET SINGLE LEAD TRACK =================
exports.getLeadTrackById = async (req, res) => {
  try {
    const track = await LeadTrack.findById(req.params.id)
      .populate("assignedTo", "name email phone")
      .populate("createdBy", "name email");

    if (!track) {
      return res.status(404).json({ success: false, message: "Lead Track not found" });
    }

    const candidateIds = await getCandidateUserIds(req.user);
    if (!hasTrackAccess(track, req.user, candidateIds)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const trackObj = track.toObject();
    trackObj.products = trackObj.products.map((p) => {
      const quotedCount = p.onboardedLeads.filter((l) => l.stage === "Quote").length;
      const isNoTarget = !!p.noTarget;
      return {
        ...p,
        noTarget: isNoTarget,
        onboardedCount: p.onboardedLeads.length,
        quotedCount,
        remainingTarget: isNoTarget ? "No Target" : Math.max(0, (p.target || 0) - quotedCount),
        callCount: p.onboardedLeads.filter((l) => l.stage === "Call").length,
        whatsappCount: p.onboardedLeads.filter((l) => l.stage === "WhatsappMessage").length,
        demoCount: p.onboardedLeads.filter((l) => l.stage === "Demo").length,
      };
    });

    res.status(200).json({
      success: true,
      leadTrack: trackObj,
    });
  } catch (error) {
    console.error("Get LeadTrack By Id Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= UPDATE LEAD TRACK (ADMIN ONLY) =================
exports.updateLeadTrack = async (req, res) => {
  try {
    const { startMonth, endMonth, title, status, products } = req.body;
    const track = await LeadTrack.findById(req.params.id);

    if (!track) {
      return res.status(404).json({ success: false, message: "Lead Track not found" });
    }

    const validProducts = [
      "Genunitys",
      "Rewards",
      "CRM",
      "Custom-Website",
      "WhatsappAtuomation",
      "Projects",
      "QuickCommerce",
    ];

    if (startMonth) track.startMonth = startMonth;
    if (endMonth) track.endMonth = endMonth;
    if (title !== undefined) track.title = title;
    if (status) track.status = status;

    if (products && Array.isArray(products)) {
      // 1. Identify which product names were provided in the updated list
      const desiredProductNames = products
        .map((p) => p.productName)
        .filter((name) => validProducts.includes(name));

      // 2. Remove products that are no longer in the desired list
      track.products = track.products.filter((p) =>
        desiredProductNames.includes(p.productName)
      );

      // 3. Update existing products or push newly added ones
      products.forEach((updatedP) => {
        if (!validProducts.includes(updatedP.productName)) return;

        const existingP = track.products.find(
          (p) =>
            (updatedP._id && String(p._id) === String(updatedP._id)) ||
            p.productName === updatedP.productName
        );

        const isNoTarget = !!updatedP.noTarget;
        const targetVal = isNoTarget
          ? 0
          : Math.max(0, parseInt(updatedP.target, 10) || 0);

        if (existingP) {
          existingP.noTarget = isNoTarget;
          existingP.target = targetVal;
        } else {
          track.products.push({
            productName: updatedP.productName,
            target: targetVal,
            noTarget: isNoTarget,
            onboardedLeads: [],
          });
        }
      });
    }

    await track.save();

    res.status(200).json({
      success: true,
      message: "Lead Track updated successfully",
      leadTrack: track,
    });
  } catch (error) {
    console.error("Update LeadTrack Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= REMOVE PRODUCT FROM TRACK (ADMIN ONLY) =================
exports.removeProductFromTrack = async (req, res) => {
  try {
    const { id, productId } = req.params;
    const track = await LeadTrack.findById(id);

    if (!track) {
      return res.status(404).json({ success: false, message: "Lead Track not found" });
    }

    const initialLength = track.products.length;
    track.products = track.products.filter(
      (p) => String(p._id) !== String(productId) && p.productName !== productId
    );

    if (track.products.length === initialLength) {
      return res.status(404).json({ success: false, message: "Product not found in this track" });
    }

    await track.save();

    res.status(200).json({
      success: true,
      message: "Product removed from lead track successfully",
      leadTrack: track,
    });
  } catch (error) {
    console.error("Remove Product Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= DELETE LEAD TRACK (ADMIN ONLY) =================
exports.deleteLeadTrack = async (req, res) => {
  try {
    const track = await LeadTrack.findByIdAndDelete(req.params.id);
    if (!track) {
      return res.status(404).json({ success: false, message: "Lead Track not found" });
    }
    res.status(200).json({ success: true, message: "Lead Track deleted successfully" });
  } catch (error) {
    console.error("Delete LeadTrack Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= ONBOARD LEADS TO A PRODUCT CARD =================
exports.onboardLeadsToProduct = async (req, res) => {
  try {
    const { id, productId } = req.params;
    const { customerIds, leads } = req.body;

    const track = await LeadTrack.findById(id);
    if (!track) {
      return res.status(404).json({ success: false, message: "Lead Track not found" });
    }

    const candidateIds = await getCandidateUserIds(req.user);
    if (!hasTrackAccess(track, req.user, candidateIds)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const product = track.products.id(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product card not found in this track" });
    }

    const isNoTarget = !!product.noTarget;
    const currentOnboarded = product.onboardedLeads.length;
    const availableSlots = isNoTarget ? Infinity : (product.target - currentOnboarded);

    if (!isNoTarget && availableSlots <= 0) {
      return res.status(400).json({
        success: false,
        message: `Target of ${product.target} leads already reached for ${product.productName}. Cannot onboard more.`,
      });
    }

    const newLeadsToAdd = [];

    // Case 1: customerIds provided (selected from overall customers)
    if (customerIds && Array.isArray(customerIds) && customerIds.length > 0) {
      const customers = await Customer.find({ _id: { $in: customerIds } });
      const existingCustomerIds = new Set(
        product.onboardedLeads.map((l) => (l.customerId ? String(l.customerId) : null)).filter(Boolean)
      );

      for (const cust of customers) {
        if (!isNoTarget && newLeadsToAdd.length >= availableSlots) break;
        if (existingCustomerIds.has(String(cust._id))) continue;

        const initialNote = (cust.remark || "").trim();
        newLeadsToAdd.push({
          customerId: cust._id,
          name: cust.name || "",
          company: cust.company || "",
          phone: cust.phone || "",
          email: cust.email || "",
          location: cust.location || "",
          sparkName: cust.sparkName || "",
          sparkNumber: cust.sparkNumber || "",
          stage: "Call",
          stageHistory: [
            {
              stage: "Call",
              updatedAt: new Date(),
              updatedBy: req.user._id,
              updatedByName: req.user.name || "User",
            },
          ],
          notes: initialNote,
          notesHistory: initialNote
            ? [
                {
                  note: initialNote,
                  stage: "Call",
                  authorName: req.user.name || "User",
                  authorId: req.user._id,
                  createdAt: new Date(),
                },
              ]
            : [],
          onboardedAt: new Date(),
        });
      }
    }

    // Case 2: manual lead objects provided
    if (leads && Array.isArray(leads) && leads.length > 0) {
      for (const item of leads) {
        if (!isNoTarget && newLeadsToAdd.length >= availableSlots) break;
        const initialNote = (item.notes || "").trim();
        newLeadsToAdd.push({
          customerId: item.customerId || null,
          name: item.name || "",
          company: item.company || "",
          phone: item.phone || "",
          email: item.email || "",
          location: item.location || "",
          sparkName: item.sparkName || "",
          sparkNumber: item.sparkNumber || "",
          stage: item.stage || "Call",
          stageHistory: [
            {
              stage: item.stage || "Call",
              updatedAt: new Date(),
              updatedBy: req.user._id,
              updatedByName: req.user.name || "User",
            },
          ],
          notes: initialNote,
          notesHistory: initialNote
            ? [
                {
                  note: initialNote,
                  stage: item.stage || "Call",
                  authorName: req.user.name || "User",
                  authorId: req.user._id,
                  createdAt: new Date(),
                },
              ]
            : [],
          onboardedAt: new Date(),
        });
      }
    }

    if (newLeadsToAdd.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No new valid leads to onboard (they may already be onboarded).",
      });
    }

    product.onboardedLeads.push(...newLeadsToAdd);
    await track.save();

    const quotedCount = product.onboardedLeads.filter((l) => l.stage === "Quote").length;
    const remainingTarget = isNoTarget ? "No Target" : Math.max(0, product.target - quotedCount);

    res.status(200).json({
      success: true,
      message: `${newLeadsToAdd.length} lead(s) onboarded successfully into ${product.productName}`,
      onboardedCount: product.onboardedLeads.length,
      quotedCount,
      remainingTarget,
      product,
    });
  } catch (error) {
    console.error("Onboard Leads Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= UPDATE LEAD STAGE (Call -> WhatsappMessage -> Demo -> Quote) =================
exports.updateLeadStage = async (req, res) => {
  try {
    const { id, productId, leadId } = req.params;
    const { stage, notes } = req.body;

    const validStages = ["Call", "WhatsappMessage", "Demo", "Quote"];
    if (!validStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stage. Must be one of: ${validStages.join(", ")}`,
      });
    }

    const track = await LeadTrack.findById(id);
    if (!track) {
      return res.status(404).json({ success: false, message: "Lead Track not found" });
    }

    const candidateIds = await getCandidateUserIds(req.user);
    if (!hasTrackAccess(track, req.user, candidateIds)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const product = track.products.id(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product card not found" });
    }

    const lead = product.onboardedLeads.id(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found in this product" });
    }

    lead.stage = stage;
    if (notes !== undefined && notes !== null && String(notes).trim() !== "") {
      const cleanNote = String(notes).trim();
      lead.notes = cleanNote;
      if (!lead.notesHistory) lead.notesHistory = [];
      lead.notesHistory.push({
        note: cleanNote,
        stage: stage,
        authorName: req.user.name || "User",
        authorId: req.user._id,
        createdAt: new Date(),
      });
    }

    // Track timestamp when moved into Quote
    if (stage === "Quote") {
      lead.quotedAt = new Date();
    }

    if (!lead.stageHistory) lead.stageHistory = [];
    lead.stageHistory.push({
      stage,
      updatedAt: new Date(),
      updatedBy: req.user._id,
      updatedByName: req.user.name || "User",
    });

    await track.save();

    const quotedCount = product.onboardedLeads.filter((l) => l.stage === "Quote").length;
    const remainingTarget = product.noTarget ? "No Target" : Math.max(0, (product.target || 0) - quotedCount);

    res.status(200).json({
      success: true,
      message: `Lead stage updated to ${stage}`,
      lead,
      productStats: {
        productName: product.productName,
        target: product.target,
        noTarget: !!product.noTarget,
        onboardedCount: product.onboardedLeads.length,
        quotedCount,
        remainingTarget,
      },
    });
  } catch (error) {
    console.error("Update Lead Stage Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= ADD / EDIT LEAD NOTE (ANY TIME) =================
exports.updateLeadNotes = async (req, res) => {
  try {
    const { id, productId, leadId } = req.params;
    const { note, stage } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: "Note text is required" });
    }

    const track = await LeadTrack.findById(id);
    if (!track) {
      return res.status(404).json({ success: false, message: "Lead Track not found" });
    }

    const candidateIds = await getCandidateUserIds(req.user);
    if (!hasTrackAccess(track, req.user, candidateIds)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const product = track.products.id(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product card not found" });
    }

    const lead = product.onboardedLeads.id(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found in this product" });
    }

    const cleanNote = note.trim();
    lead.notes = cleanNote;

    if (!lead.notesHistory) lead.notesHistory = [];
    lead.notesHistory.push({
      note: cleanNote,
      stage: stage || lead.stage || "Call",
      authorName: req.user.name || "User",
      authorId: req.user._id,
      createdAt: new Date(),
    });

    await track.save();

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      notes: lead.notes,
      notesHistory: lead.notesHistory,
      lead,
    });
  } catch (error) {
    console.error("Update Lead Notes Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= CLEAR ALL LEAD TRACKS (ADMIN ONLY) =================
exports.clearAllLeadTracks = async (req, res) => {
  try {
    const result = await LeadTrack.deleteMany({});
    res.status(200).json({
      success: true,
      message: `All lead tracks cleared successfully (${result.deletedCount} tracks deleted)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear All Lead Tracks Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= REMOVE LEAD FROM PRODUCT =================
exports.removeLeadFromProduct = async (req, res) => {
  try {
    const { id, productId, leadId } = req.params;

    const track = await LeadTrack.findById(id);
    if (!track) {
      return res.status(404).json({ success: false, message: "Lead Track not found" });
    }

    const candidateIds = await getCandidateUserIds(req.user);
    if (!hasTrackAccess(track, req.user, candidateIds)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const product = track.products.id(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product card not found" });
    }

    product.onboardedLeads.pull(leadId);
    await track.save();

    const quotedCount = product.onboardedLeads.filter((l) => l.stage === "Quote").length;
    const remainingTarget = product.noTarget ? "No Target" : Math.max(0, (product.target || 0) - quotedCount);

    res.status(200).json({
      success: true,
      message: "Lead removed from track",
      productStats: {
        productName: product.productName,
        target: product.target,
        noTarget: !!product.noTarget,
        onboardedCount: product.onboardedLeads.length,
        quotedCount,
        remainingTarget,
      },
    });
  } catch (error) {
    console.error("Remove Lead Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= ADMIN REPORT & ANALYTICS =================
exports.getAdminLeadTrackReport = async (req, res) => {
  try {
    const tracks = await LeadTrack.find()
      .populate("assignedTo", "name email phone")
      .sort({ createdAt: -1 });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Current month start & end
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // Last month start & end
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    let totalAllTarget = 0;
    let totalAllOnboarded = 0;
    let totalAllQuoted = 0;
    let totalCurrentMonthQuoted = 0;
    let totalLastMonthQuoted = 0;

    // Group report by user/employee
    const userMap = new Map();

    for (const track of tracks) {
      const assignedObj =
        track.assignedTo && typeof track.assignedTo === "object"
          ? track.assignedTo
          : null;
      let uId = String(assignedObj?._id || track.assignedTo || "unknown");
      let uName = track.assignedToName || assignedObj?.name || "";
      let uEmail = assignedObj?.email || "";

      // Fallback lookup if assignedTo was an Employee ID not in UserDetails
      if (!uEmail && track.assignedTo) {
        try {
          const emp = await Employee.findById(track.assignedTo).select("name email");
          if (emp) {
            uName = uName || emp.name;
            uEmail = emp.email || "";
          }
        } catch (e) {}
      }

      if (!uName) uName = "Unknown User";

      // Group together by email or normalized name
      const mapKey = uEmail ? uEmail.toLowerCase().trim() : uName.toLowerCase().trim();

      if (!userMap.has(mapKey)) {
        userMap.set(mapKey, {
          userId: uId,
          userName: uName,
          userEmail: uEmail,
          tracksCount: 0,
          cardsCount: 0,
          totalTarget: 0,
          totalOnboarded: 0,
          totalQuoted: 0,
          remainingTarget: 0,
          currentMonthQuoted: 0,
          lastMonthQuoted: 0,
          cards: [],
          tracks: [],
        });
      }

      const userData = userMap.get(mapKey);
      userData.tracksCount += 1;

      let trackTarget = 0;
      let trackOnboarded = 0;
      let trackQuoted = 0;

      const trackCards = track.products.map((p) => {
        const quotedCount = p.onboardedLeads.filter((l) => l.stage === "Quote").length;
        const isNoTarget = !!p.noTarget;
        const remainingTarget = isNoTarget ? "No Target" : Math.max(0, (p.target || 0) - quotedCount);

        let pCurrentMonthQuoted = 0;
        let pLastMonthQuoted = 0;

        p.onboardedLeads.forEach((l) => {
          if (l.stage === "Quote" && l.quotedAt) {
            const qDate = new Date(l.quotedAt);
            if (qDate >= currentMonthStart && qDate <= currentMonthEnd) {
              pCurrentMonthQuoted += 1;
            } else if (qDate >= lastMonthStart && qDate <= lastMonthEnd) {
              pLastMonthQuoted += 1;
            }
          }
        });

        if (!isNoTarget) {
          trackTarget += p.target || 0;
          totalAllTarget += p.target || 0;
          userData.totalTarget += p.target || 0;
        }
        trackOnboarded += p.onboardedLeads.length;
        trackQuoted += quotedCount;

        totalAllOnboarded += p.onboardedLeads.length;
        totalAllQuoted += quotedCount;
        totalCurrentMonthQuoted += pCurrentMonthQuoted;
        totalLastMonthQuoted += pLastMonthQuoted;

        userData.totalOnboarded += p.onboardedLeads.length;
        userData.totalQuoted += quotedCount;
        userData.currentMonthQuoted += pCurrentMonthQuoted;
        userData.lastMonthQuoted += pLastMonthQuoted;
        userData.cardsCount += 1;

        const cardData = {
          trackId: track._id,
          trackTitle: track.title,
          startMonth: track.startMonth,
          endMonth: track.endMonth,
          productName: p.productName,
          target: p.target || 0,
          noTarget: isNoTarget,
          onboardedCount: p.onboardedLeads.length,
          quotedCount,
          remainingTarget,
          currentMonthQuoted: pCurrentMonthQuoted,
          lastMonthQuoted: pLastMonthQuoted,
          leads: p.onboardedLeads,
        };

        userData.cards.push(cardData);
        return cardData;
      });

      userData.remainingTarget = Math.max(0, userData.totalTarget - userData.totalQuoted);
      userData.tracks.push({
        _id: track._id,
        title: track.title,
        startMonth: track.startMonth,
        endMonth: track.endMonth,
        status: track.status,
        target: trackTarget,
        onboarded: trackOnboarded,
        quoted: trackQuoted,
        remaining: Math.max(0, trackTarget - trackQuoted),
        products: trackCards,
      });
    }

    const usersReport = Array.from(userMap.values());

    res.status(200).json({
      success: true,
      summary: {
        totalTracks: tracks.length,
        totalUsersTracked: usersReport.length,
        totalTarget: totalAllTarget,
        totalOnboarded: totalAllOnboarded,
        totalQuoted: totalAllQuoted,
        totalRemainingTarget: Math.max(0, totalAllTarget - totalAllQuoted),
        currentMonthQuoted: totalCurrentMonthQuoted,
        lastMonthQuoted: totalLastMonthQuoted,
        currentMonthName: currentMonthStart.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        lastMonthName: lastMonthStart.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
      },
      usersReport,
    });
  } catch (error) {
    console.error("Get Admin Lead Track Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

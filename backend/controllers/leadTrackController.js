const LeadTrack = require("../models/leadTrackModel");
const User = require("../models/userModel");
const Customer = require("../models/customerModel");

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

    // Look up assigned user
    const user = await User.findById(assignedTo).select("name email");
    if (!user) {
      return res.status(404).json({ success: false, message: "Assigned user not found" });
    }

    // Validate products and targets
    const validProducts = [
      "Genunitys",
      "Rewards",
      "CRM",
      "Custom-Website",
      "WhatsappAtuomation",
    ];

    const formattedProducts = products.map((p) => {
      if (!validProducts.includes(p.productName)) {
        throw new Error(`Invalid product name: ${p.productName}`);
      }
      return {
        productName: p.productName,
        target: Math.max(0, parseInt(p.target, 10) || 0),
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
      filter.assignedTo = req.user._id;
    } else if (userId) {
      filter.assignedTo = userId;
    }

    if (status) {
      filter.status = status;
    }

    if (month) {
      // Matches startMonth or endMonth
      filter.$or = [{ startMonth: month }, { endMonth: month }];
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
        const remainingTarget = Math.max(0, p.target - quotedCount);
        totalTarget += p.target;
        totalOnboarded += p.onboardedLeads.length;
        totalQuoted += quotedCount;

        return {
          ...p,
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

    const isAdmin = req.user.role === "super_admin";
    if (!isAdmin && String(track.assignedTo._id || track.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const trackObj = track.toObject();
    trackObj.products = trackObj.products.map((p) => {
      const quotedCount = p.onboardedLeads.filter((l) => l.stage === "Quote").length;
      return {
        ...p,
        onboardedCount: p.onboardedLeads.length,
        quotedCount,
        remainingTarget: Math.max(0, p.target - quotedCount),
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

    if (startMonth) track.startMonth = startMonth;
    if (endMonth) track.endMonth = endMonth;
    if (title) track.title = title;
    if (status) track.status = status;

    if (products && Array.isArray(products)) {
      // Update target or add new products without losing existing onboarded leads
      products.forEach((updatedP) => {
        const existingP = track.products.find(
          (p) => String(p._id) === String(updatedP._id) || p.productName === updatedP.productName
        );
        if (existingP) {
          if (updatedP.target !== undefined) {
            existingP.target = Math.max(0, parseInt(updatedP.target, 10) || 0);
          }
        } else if (updatedP.productName) {
          track.products.push({
            productName: updatedP.productName,
            target: Math.max(0, parseInt(updatedP.target, 10) || 0),
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

    const isAdmin = req.user.role === "super_admin";
    if (!isAdmin && String(track.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const product = track.products.id(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product card not found in this track" });
    }

    const currentOnboarded = product.onboardedLeads.length;
    const availableSlots = product.target - currentOnboarded;

    if (availableSlots <= 0) {
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
        if (newLeadsToAdd.length >= availableSlots) break;
        if (existingCustomerIds.has(String(cust._id))) continue;

        newLeadsToAdd.push({
          customerId: cust._id,
          name: cust.name || "",
          company: cust.company || "",
          phone: cust.phone || "",
          email: cust.email || "",
          location: cust.location || "",
          stage: "Call",
          stageHistory: [{ stage: "Call", updatedAt: new Date(), updatedBy: req.user._id }],
          notes: cust.remark || "",
          onboardedAt: new Date(),
        });
      }
    }

    // Case 2: manual lead objects provided
    if (leads && Array.isArray(leads) && leads.length > 0) {
      for (const item of leads) {
        if (newLeadsToAdd.length >= availableSlots) break;
        newLeadsToAdd.push({
          customerId: item.customerId || null,
          name: item.name || "",
          company: item.company || "",
          phone: item.phone || "",
          email: item.email || "",
          location: item.location || "",
          stage: item.stage || "Call",
          stageHistory: [{ stage: item.stage || "Call", updatedAt: new Date(), updatedBy: req.user._id }],
          notes: item.notes || "",
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
    const remainingTarget = Math.max(0, product.target - quotedCount);

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

    const isAdmin = req.user.role === "super_admin";
    if (!isAdmin && String(track.assignedTo) !== String(req.user._id)) {
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
    if (notes !== undefined) lead.notes = notes;

    // Track timestamp when moved into Quote
    if (stage === "Quote") {
      lead.quotedAt = new Date();
    }

    lead.stageHistory.push({
      stage,
      updatedAt: new Date(),
      updatedBy: req.user._id,
    });

    await track.save();

    const quotedCount = product.onboardedLeads.filter((l) => l.stage === "Quote").length;
    const remainingTarget = Math.max(0, product.target - quotedCount);

    res.status(200).json({
      success: true,
      message: `Lead stage updated to ${stage}`,
      lead,
      productStats: {
        productName: product.productName,
        target: product.target,
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

// ================= REMOVE LEAD FROM PRODUCT =================
exports.removeLeadFromProduct = async (req, res) => {
  try {
    const { id, productId, leadId } = req.params;

    const track = await LeadTrack.findById(id);
    if (!track) {
      return res.status(404).json({ success: false, message: "Lead Track not found" });
    }

    const isAdmin = req.user.role === "super_admin";
    if (!isAdmin && String(track.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const product = track.products.id(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product card not found" });
    }

    product.onboardedLeads.pull(leadId);
    await track.save();

    const quotedCount = product.onboardedLeads.filter((l) => l.stage === "Quote").length;
    const remainingTarget = Math.max(0, product.target - quotedCount);

    res.status(200).json({
      success: true,
      message: "Lead removed from track",
      productStats: {
        productName: product.productName,
        target: product.target,
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

    // Group report by user
    const userMap = new Map();

    tracks.forEach((track) => {
      const uId = String(track.assignedTo?._id || track.assignedTo || "unknown");
      const uName = track.assignedToName || track.assignedTo?.name || "Unknown User";

      if (!userMap.has(uId)) {
        userMap.set(uId, {
          userId: uId,
          userName: uName,
          userEmail: track.assignedTo?.email || "",
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

      const userData = userMap.get(uId);
      userData.tracksCount += 1;

      let trackTarget = 0;
      let trackOnboarded = 0;
      let trackQuoted = 0;

      const trackCards = track.products.map((p) => {
        const quotedCount = p.onboardedLeads.filter((l) => l.stage === "Quote").length;
        const remainingTarget = Math.max(0, p.target - quotedCount);

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

        trackTarget += p.target;
        trackOnboarded += p.onboardedLeads.length;
        trackQuoted += quotedCount;

        totalAllTarget += p.target;
        totalAllOnboarded += p.onboardedLeads.length;
        totalAllQuoted += quotedCount;
        totalCurrentMonthQuoted += pCurrentMonthQuoted;
        totalLastMonthQuoted += pLastMonthQuoted;

        userData.totalTarget += p.target;
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
          target: p.target,
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
    });

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
        currentMonthName: currentMonthStart.toLocaleString("default", { month: "long", year: "numeric" }),
        lastMonthName: lastMonthStart.toLocaleString("default", { month: "long", year: "numeric" }),
      },
      usersReport,
    });
  } catch (error) {
    console.error("Get Admin Lead Track Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

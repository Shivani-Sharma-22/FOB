import Report from '../models/reportModel.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const createReport = async (req, res) => {
  try {
    req.body.user = req.user.id;

    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push(file.filename);
      });
    }

    req.body.images = images;

    console.log(req.body);

    const report = await Report.create(req.body);

    const user = await User.findById(req.user.id);
    user.rewardPoints += 10;

    const reportCount = await Report.countDocuments({ user: req.user.id });
    if (reportCount === 1 && !user.achievements.includes('First Report')) {
      user.achievements.push('First Report');
    } else if (reportCount === 5 && !user.achievements.includes('Five Reports')) {
      user.achievements.push('Five Reports');
      user.rewardPoints += 50; reports
    } else if (reportCount === 10 && !user.achievements.includes('Ten Reports')) {
      user.achievements.push('Ten Reports');
      user.rewardPoints += 100;
    }

    await user.save();

    res.status(201).json({
      success: true,
      data: report,
      points: user.rewardPoints,
      achievements: user.achievements
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};


export const getReports = async (req, res) => {
  try {
    let query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.condition) {
      query.condition = req.query.condition;
    }

    if (req.query.issueType) {
      query.issueType = req.query.issueType;
    }

    if (req.query.lat && req.query.lng && req.query.radius) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radius = parseInt(req.query.radius) / 6378.1;

      query['location.coordinates'] = {
        $geoWithin: { $centerSphere: [[lng, lat], radius] }
      };
    }

    let sort = {};
    if (req.query.sortBy) {
      const sortFields = req.query.sortBy.split(',');
      sortFields.forEach(field => {
        const [fieldName, order] = field.split(':');
        sort[fieldName] = order === 'desc' ? -1 : 1;
      });
    } else {
      sort = { createdAt: -1 };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const reports = await Report.find(query)
      .populate('user', 'name avatar')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);

    const total = await Report.countDocuments(query);

    res.status(200).json({
      success: true,
      count: reports.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: reports
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserReports = async (req, res) => {
    try{
        const userId = req.user.id;

        const reports = await Report.find({ user: userId })
            .populate('user', 'name avatar')
            .populate('publicComments.user', 'name avatar')
            .populate('adminComments.user', 'name avatar');

        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

}

export const getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'name avatar')
      .populate('publicComments.user', 'name avatar')
      .populate('adminComments.user', 'name avatar');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateReport = async (req, res) => {
  try {
    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to update this report' });
    }

    if (req.files && req.files.length > 0) {
      const images = [...report.images];
      req.files.forEach(file => {
        images.push(file.filename);
      });
      req.body.images = images;
    }

    report = await Report.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this report' });
    }

    await report.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addPublicComment = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const comment = {
      comment: req.body.comment,
      user: req.user.id
    };

    report.publicComments.push(comment);
    await report.save();

    const populatedReport = await Report.findById(req.params.id)
      .populate('publicComments.user', 'name avatar');

    res.status(200).json({
      success: true,
      data: populatedReport.publicComments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addAdminComment = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to add admin comments' });
    }

    const comment = {
      comment: req.body.comment,
      user: req.user.id
    };

    report.adminComments.push(comment);

    if (req.body.status) {
      report.status = req.body.status;

      if (req.body.status === 'Resolved') {
        const user = await User.findById(report.user);
        user.rewardPoints += 25;

        if (!user.achievements.includes('Problem Solver')) {
          user.achievements.push('Problem Solver');
          user.rewardPoints += 50;
        }

        await user.save();
      }
    }

    await report.save();

    const populatedReport = await Report.findById(req.params.id)
      .populate('adminComments.user', 'name avatar');

    res.status(200).json({
      success: true,
      data: populatedReport.adminComments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const upvoteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.upvotes += 1;
    await report.save();

    const user = await User.findById(report.user);
    user.rewardPoints += 2;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        upvotes: report.upvotes
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
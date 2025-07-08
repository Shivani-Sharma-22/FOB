import Reward from '../models/rewardModel.js';
import User from '../models/userModel.js';
import crypto from 'crypto';

export const createReward = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to create rewards' });
    }
    if (req.file) {
      req.body.image = req.file.filename;
    }
    const reward = await Reward.create(req.body);

    res.status(201).json({
      success: true,
      data: reward
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};


export const getRewards = async (req, res) => {
  try {
    let query = {};

    if (req.query.category) {
      query.category = req.query.category;
    }

    query.isActive = true;

    let sort = {};
    if (req.query.sortBy) {
      const sortFields = req.query.sortBy.split(',');
      sortFields.forEach(field => {
        const [fieldName, order] = field.split(':');
        sort[fieldName] = order === 'desc' ? -1 : 1;
      });
    } else {
      sort = { pointsCost: 1 };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const rewards = await Reward.find(query)
      .sort(sort)
      .skip(startIndex)
      .limit(limit);

    const total = await Reward.countDocuments(query);

    res.status(200).json({
      success: true,
      count: rewards.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: rewards
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getReward = async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    res.status(200).json({
      success: true,
      data: reward
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateReward = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to update rewards' });
    }

    let reward = await Reward.findById(req.params.id);

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    reward = await Reward.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: reward
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReward = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete rewards' });
    }

    const reward = await Reward.findById(req.params.id);

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    await reward.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const redeemReward = async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    if (!reward.isActive) {
      return res.status(400).json({ message: 'This reward is not available for redemption' });
    }

    if (reward.expiryDate && new Date(reward.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'This reward has expired' });
    }

    if (reward.availability !== -1 && reward.redemptions.length >= reward.availability) {
      return res.status(400).json({ message: 'No more of this reward is available' });
    }

    const user = await User.findById(req.user.id);

    if (user.rewardPoints < reward.pointsCost) {
      return res.status(400).json({
        message: 'Not enough points to redeem this reward',
        userPoints: user.rewardPoints,
        requiredPoints: reward.pointsCost
      });
    }

    const redemptionCode = crypto.randomBytes(8).toString('hex');

    reward.redemptions.push({
      user: req.user.id,
      code: redemptionCode
    });

    user.rewardPoints -= reward.pointsCost;

    const userRedemptions = await Reward.countDocuments({
      'redemptions.user': req.user.id
    });

    if (userRedemptions >= 5 && !user.achievements.includes('Community Guardian')) {
      user.achievements.push('Community Guardian');
      user.rewardPoints += 75;
    }

    await reward.save();
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        redemptionCode,
        remainingPoints: user.rewardPoints,
        achievements: user.achievements
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getMyRewards = async (req, res) => {
  try {
    const redeemedRewards = await Reward.find({
      'redemptions.user': req.user.id
    });

    const myRewards = redeemedRewards.map(reward => {
      const userRedemptions = reward.redemptions.filter(
        r => r.user.toString() === req.user.id
      );

      return {
        _id: reward._id,
        name: reward.name,
        description: reward.description,
        category: reward.category,
        image: reward.image,
        pointsCost: reward.pointsCost,
        redemptions: userRedemptions
      };
    });

    res.status(200).json({
      success: true,
      count: myRewards.length,
      data: myRewards
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
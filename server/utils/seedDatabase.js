const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { User, Submission } = require('../models');

const connectDB = require('../config/database');

const seedUsers = [
  {
    username: 'AdminUser',
    email: 'admin@wikimake.com',
    password: 'admin123',
    country: 'CA',
    role: 'admin',
    points: 1000,
    badges: ['early-adopter', 'super-verifier', 'country-expert'],
    isActive: true
  },
  {
    username: 'SourceVerifier',
    email: 'verifier@wikimake.com',
    password: 'verifier123',
    country: 'GB',
    role: 'verifier',
    points: 450,
    badges: ['super-verifier', 'country-expert'],
    isActive: true
  },
  {
    username: 'WikiEditor2024',
    email: 'editor@wikimake.com',
    password: 'editor123',
    country: 'US',
    role: 'contributor',
    points: 150,
    badges: ['first-submission', '10-verified', 'early-adopter'],
    isActive: true
  }
];

const seedSubmissions = [
  {
    url: 'https://www.nature.com/articles/climate-change-2024',
    title: 'Climate Change Impact Study 2024',
    publisher: 'Nature Publishing Group',
    country: 'GB',
    category: 'primary',
    status: 'verified',
    wikipediaArticle: 'https://en.wikipedia.org/wiki/Climate_change',
    mediaType: 'url',
    reliability: 'credible',
    verifierNotes: 'Peer-reviewed journal, excellent source'
  },
  {
    url: 'https://arxiv.org/abs/2024.12345',
    title: 'Quantum Computing Advances',
    publisher: 'arXiv',
    country: 'US',
    category: 'primary',
    status: 'pending',
    mediaType: 'url'
  },
  {
    url: 'https://www.bbc.com/news/world-europe-12345678',
    title: 'European Union Policy Update',
    publisher: 'BBC News',
    country: 'GB',
    category: 'secondary',
    status: 'verified',
    wikipediaArticle: 'https://en.wikipedia.org/wiki/European_Union',
    mediaType: 'url',
    reliability: 'credible'
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Submission.deleteMany({});

    // Seed users
    console.log('👥 Seeding users...');
    const createdUsers = [];
    
    for (const userData of seedUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.username}`);
    }

    // Seed submissions
    console.log('📄 Seeding submissions...');
    for (let i = 0; i < seedSubmissions.length; i++) {
      const submissionData = {
        ...seedSubmissions[i],
        submitterId: createdUsers[2]._id, // WikiEditor2024
        submitterName: createdUsers[2].username
      };

      // Set verifier for verified submissions
      if (submissionData.status === 'verified') {
        submissionData.verifierId = createdUsers[1]._id; // SourceVerifier
        submissionData.verifiedDate = new Date();
      }

      const submission = new Submission(submissionData);
      
      // Add review history
      submission.reviewHistory.push({
        reviewerId: submissionData.submitterId,
        action: 'submitted',
        notes: 'Initial submission',
        date: new Date()
      });

      if (submissionData.status === 'verified') {
        submission.reviewHistory.push({
          reviewerId: submissionData.verifierId,
          action: 'approved',
          notes: submissionData.verifierNotes || 'Approved',
          date: new Date()
        });
      }

      await submission.save();
      console.log(`✅ Created submission: ${submission.title}`);
    }

    // Update user verification stats
    console.log('📊 Updating user stats...');
    const submitterStats = await Submission.getUserStats(createdUsers[2]._id);
    createdUsers[2].verificationStats = {
      submitted: submitterStats.total,
      verified: submitterStats.verified,
      rejected: submitterStats.rejected,
      successRate: submitterStats.total > 0 ? Math.round((submitterStats.verified / submitterStats.total) * 100) : 0
    };
    await createdUsers[2].save();

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Seed Data Summary:');
    console.log(`👥 Users created: ${createdUsers.length}`);
    console.log(`📄 Submissions created: ${seedSubmissions.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log('Admin: admin@wikimake.com / admin123');
    console.log('Verifier: verifier@wikimake.com / verifier123');
    console.log('Contributor: editor@wikimake.com / editor123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WikiSource Verifier API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the WikiSource Verifier platform - a system for verifying and managing Wikipedia source submissions',
      contact: {
        name: 'API Support',
        email: 'support@wikisource-verifier.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.wikisource-verifier.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login or register endpoint'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in HTTP-only cookie'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username',
              example: 'johndoe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            country: {
              type: 'string',
              description: 'User country',
              example: 'US'
            },
            role: {
              type: 'string',
              enum: ['contributor', 'verifier', 'admin'],
              description: 'User role',
              example: 'contributor'
            },
            points: {
              type: 'number',
              description: 'User points',
              example: 150
            },
            badges: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'First Contribution'
                  },
                  icon: {
                    type: 'string',
                    example: 'star'
                  },
                  earnedAt: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user account is active',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Submission: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Submission ID'
            },
            title: {
              type: 'string',
              description: 'Wikipedia article title',
              example: 'Artificial Intelligence'
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'Wikipedia article URL',
              example: 'https://en.wikipedia.org/wiki/Artificial_intelligence'
            },
            country: {
              type: 'string',
              description: 'Country code',
              example: 'US'
            },
            status: {
              type: 'string',
              enum: ['pending', 'verified', 'rejected'],
              description: 'Submission status',
              example: 'pending'
            },
            submittedBy: {
              type: 'string',
              description: 'User ID of submitter'
            },
            verifiedBy: {
              type: 'string',
              description: 'User ID of verifier',
              nullable: true
            },
            verificationNotes: {
              type: 'string',
              description: 'Notes from verifier',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required or invalid token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Not authorized to access this route'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Access forbidden. Admin role required.'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation failed',
                errors: [
                  {
                    field: 'email',
                    message: 'Please provide a valid email'
                  }
                ]
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Submissions',
        description: 'Wikipedia source submission management'
      },
      {
        name: 'Users',
        description: 'User profile and management endpoints'
      },
      {
        name: 'Admin',
        description: 'Administrative operations (Admin only)'
      },
      {
        name: 'Countries',
        description: 'Country statistics and management'
      },
      {
        name: 'System',
        description: 'System health and maintenance (Admin only)'
      },
      {
        name: 'Reports',
        description: 'Analytics and reporting (Admin/Verifier only)'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/server.js'] // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;


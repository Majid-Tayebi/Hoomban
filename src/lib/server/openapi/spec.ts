import type { OpenAPIV3_1 } from './types';

const bearerSecurity: OpenAPIV3_1.SecuritySchemeObject = {
	type: 'http',
	scheme: 'bearer',
	bearerFormat: 'PocketBase JWT',
	description: 'Bearer token or session cookie (hoomban_session)'
};

const errorResponse = {
	description: 'Error',
	content: {
		'application/json': {
			schema: { $ref: '#/components/schemas/ErrorBody' }
		}
	}
} satisfies OpenAPIV3_1.ResponseObject;

export const openApiDocument: OpenAPIV3_1.Document = {
	openapi: '3.1.0',
	info: {
		title: 'Hoomban API',
		version: '1.0.0',
		description:
			'REST API for Hoomban clinic platform. Most routes require Bearer auth or session cookie.'
	},
	servers: [{ url: '/api', description: 'Application API base' }],
	tags: [
		{ name: 'auth', description: 'Authentication and session' },
		{ name: 'psych', description: 'Psychological tests' },
		{ name: 'appointments', description: 'Appointments' },
		{ name: 'notifications', description: 'Notifications' },
		{ name: 'messages', description: 'Internal messages' },
		{ name: 'payments', description: 'Online payments' },
		{ name: 'push', description: 'Web Push subscriptions' },
		{ name: 'desk', description: 'Secretary desk' },
		{ name: 'profile', description: 'Profile utilities' }
	],
	paths: {
		'/auth/login': {
			post: {
				tags: ['auth'],
				summary: 'Login with username/password',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['username', 'password'],
								properties: {
									username: { type: 'string' },
									password: { type: 'string', format: 'password' }
								}
							}
						}
					}
				},
				responses: {
					'200': {
						description: 'Session created',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/AuthSuccess' }
							}
						}
					},
					'401': errorResponse,
					'429': errorResponse
				}
			}
		},
		'/auth/logout': {
			post: {
				tags: ['auth'],
				summary: 'Clear session cookie',
				responses: { '200': { description: 'Logged out' } }
			}
		},
		'/auth/session': {
			post: {
				tags: ['auth'],
				security: [{ bearerAuth: [] }],
				summary: 'Validate token and refresh session',
				responses: {
					'200': {
						description: 'Valid session',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/AuthSuccess' }
							}
						}
					},
					'401': errorResponse
				}
			}
		},
		'/psych/generic/submit': {
			post: {
				tags: ['psych'],
				security: [{ bearerAuth: [] }],
				summary: 'Submit generic psych test (server-side scoring)',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/PsychSubmitBody' }
						}
					}
				},
				responses: {
					'200': {
						description: 'Result id',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: { id: { type: 'string' } }
								}
							}
						}
					},
					'400': errorResponse,
					'401': errorResponse
				}
			}
		},
		'/psych/neo-240/submit': {
			post: {
				tags: ['psych'],
				security: [{ bearerAuth: [] }],
				summary: 'Submit NEO-240 test (server-side scoring)',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/PsychSubmitBody' }
						}
					}
				},
				responses: {
					'200': {
						description: 'Result id',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: { id: { type: 'string' } }
								}
							}
						}
					},
					'400': errorResponse,
					'401': errorResponse
				}
			}
		},
		'/psych/questions/sync': {
			post: {
				tags: ['psych'],
				security: [{ bearerAuth: [] }],
				summary: 'Batch sync psych questions (writer only)',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['testId'],
								properties: {
									testId: { type: 'string' },
									mode: { type: 'string', enum: ['generic', 'neo'] },
									questions: { type: 'array', items: { type: 'object' } }
								}
							}
						}
					}
				},
				responses: {
					'200': { description: 'Synced' },
					'403': errorResponse
				}
			}
		},
		'/appointments/create': {
			post: {
				tags: ['appointments'],
				security: [{ bearerAuth: [] }],
				summary: 'Create appointment',
				requestBody: {
					content: {
						'application/json': {
							schema: { type: 'object', additionalProperties: true }
						}
					}
				},
				responses: { '200': { description: 'Created' }, '401': errorResponse, '403': errorResponse }
			}
		},
		'/appointments/{id}': {
			patch: {
				tags: ['appointments'],
				security: [{ bearerAuth: [] }],
				summary: 'Update appointment',
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
				responses: { '200': { description: 'Updated' }, '401': errorResponse }
			}
		},
		'/notifications': {
			get: {
				tags: ['notifications'],
				security: [{ bearerAuth: [] }],
				summary: 'List notifications',
				responses: { '200': { description: 'Notification list' }, '401': errorResponse }
			}
		},
		'/messages': {
			post: {
				tags: ['messages'],
				security: [{ bearerAuth: [] }],
				summary: 'Send internal message',
				responses: { '200': { description: 'Sent' }, '401': errorResponse }
			}
		},
		'/payments/zarinpal/request': {
			post: {
				tags: ['payments'],
				security: [{ bearerAuth: [] }],
				summary: 'Start ZarinPal payment (serviceId required for type=service; price from DB)',
				responses: { '200': { description: 'Payment URL' }, '401': errorResponse }
			}
		},
		'/push/subscribe': {
			post: {
				tags: ['push'],
				security: [{ bearerAuth: [] }],
				summary: 'Register Web Push subscription',
				responses: { '200': { description: 'Subscribed' }, '401': errorResponse }
			}
		},
		'/desk/record-payment': {
			post: {
				tags: ['desk'],
				security: [{ bearerAuth: [] }],
				summary: 'Record desk payment',
				responses: { '200': { description: 'Recorded' }, '401': errorResponse }
			}
		},
		'/profile/check-unique': {
			post: {
				tags: ['profile'],
				security: [{ bearerAuth: [] }],
				summary: 'Check mobile/email uniqueness (authenticated)',
				responses: { '200': { description: 'Availability' }, '401': errorResponse, '429': errorResponse }
			}
		}
	},
	components: {
		securitySchemes: { bearerAuth: bearerSecurity },
		schemas: {
			ErrorBody: {
				type: 'object',
				properties: { error: { type: 'string' } }
			},
			AuthSuccess: {
				type: 'object',
				properties: {
					token: { type: 'string' },
					record: { type: 'object', additionalProperties: true }
				}
			},
			PsychSubmitBody: {
				type: 'object',
				required: ['testId', 'answers'],
				properties: {
					testId: { type: 'string' },
					answers: {
						type: 'object',
						additionalProperties: { type: 'integer' },
						description: 'Question index → selected option index'
					}
				}
			}
		}
	}
};

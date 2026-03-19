import { Request, Response, Router } from "express";
import { API_ENDPOINTS } from "../config/endpointsConfig";
import { config } from "../config/common";

/**
 * @swagger
 * tags:
 *   name: Main
 *   description: Main application endpoints
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get welcome message
 *     description: Returns a welcome message with status and timestamp
 *     tags: [Main]
 *     responses:
 *       200:
 *         description: Welcome message retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   description: HTTP status code
 *                   example: 200
 *                 message:
 *                   type: string
 *                   description: Welcome message
 *                   example: Welcome to the LMS API
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Current server timestamp
 *                   example: "2023-10-15T12:00:00.000Z"
 */
const router = Router();

router.get(API_ENDPOINTS.MAIN.DEFAULT, (_req: Request, res: Response) => {
  res.send({
    status: res.statusCode,
    message: config.MSG.WELCOME,
    timestamp: new Date().toISOString(),
  });
});

export default router;

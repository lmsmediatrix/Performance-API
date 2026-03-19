import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swaggerConfig";

const router = express.Router();

router.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "LMS API Documentation",
  })
);

export default router;

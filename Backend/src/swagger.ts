import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

// Đường dẫn tới file swagger.yaml
const swaggerPath = path.resolve(__dirname, "swagger.yaml");

// Load swagger document từ file YAML
const swaggerDocument = YAML.load(swaggerPath);

export { swaggerDocument, swaggerUi }; 
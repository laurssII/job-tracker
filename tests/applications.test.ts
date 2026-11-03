import * as sqlite from "../src/lib/applications";
import type { Repository } from "../src/lib/repository";
import { runRepositoryContract } from "./repository-contract";

// Base de datos en memoria: se crea al primer uso, así que basta con definirlo antes de llamar a nada.
process.env.DATABASE_PATH = ":memory:";

const repository: Repository = sqlite;
runRepositoryContract("SQLite (modo normal)", repository);

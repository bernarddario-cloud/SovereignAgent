import { Router } from "express";
import { getLedgerRecords } from "../ledger";

const router = Router();

router.get("/records", (req, res) => {
  const limit = Number(req.query.limit ?? 10);
  res.json(getLedgerRecords(limit));
});

export default router;

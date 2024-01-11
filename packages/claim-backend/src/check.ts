import { Request, Response} from "express";
import {address as addressUtil} from "@liskhq/lisk-cryptography";
import leafMap from "./leafMap";

export function check (req: Request, res: Response) {
  const { address } = req.body;
  try {
    addressUtil.validateLisk32Address(address);
  } catch (_) {
    res.status(400).json({
      error: true,
      message: `'${address}' is not a valid address.`,
    });
    return;
  }

  if (!leafMap[address]) {
    res.status(400).json({ error: true, message: `${address} has no eligible claim.` });
    return;
  }
  res.json(leafMap[address]);
}
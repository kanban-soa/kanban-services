import { eq, or, type AnyColumn, type SQL } from 'drizzle-orm';

// URLs sometimes carry the numeric primary key (e.g. "6") and sometimes the
// 12-char publicId. Match either column so both forms resolve to the same row.
export function dualIdMatch(
  publicIdCol: AnyColumn,
  idCol: AnyColumn,
  value: string,
): SQL {
  const asNumber = Number(value);
  if (Number.isInteger(asNumber) && asNumber > 0 && String(asNumber) === value) {
    return or(eq(publicIdCol, value), eq(idCol, asNumber)) as SQL;
  }
  return eq(publicIdCol, value);
}

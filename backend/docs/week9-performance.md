# Week 9 — SQL Performance Optimization Report

## 1. Objective

Optimize the IDX Exchange property search backend using MySQL composite indexes, measure query performance before and after optimization, and preserve existing application functionality.

## 2. Environment

- Database: MySQL 8.4.11
- Table: `rets_property`
- Dataset: Approximately 37,000 property records
- Backend: Node.js, Express, MySQL
- Frontend: React
- Advanced feature: Natural Language Property Search using the Anthropic Claude API

## 3. Benchmark Query

The benchmark filters properties using ZIP code, bedroom count, and price range.

```sql
SELECT
    L_ListingID,
    L_City,
    L_SystemPrice,
    L_Keyword2
FROM rets_property
WHERE L_Zip = '92345'
  AND L_Keyword2 = 3
  AND L_SystemPrice BETWEEN 300000 AND 900000
ORDER BY L_ListingID
LIMIT 20;
```

The selected ZIP code corresponds to Hesperia, California, and was verified against the dataset.

## 4. Baseline Performance

Before creating the new composite index, `EXPLAIN ANALYZE` showed:

- Index: `idx_L_Zip`
- Access method: Index lookup
- Index rows read: 232
- Rows remaining after filtering: 102
- Final rows returned: 20
- Execution time: 4.15 ms
- Additional sorting: Required

MySQL used the single-column ZIP index and subsequently evaluated bedroom and price filters.

## 5. Index Optimization

A new composite index was created:

```sql
CREATE INDEX idx_property_zip_beds_price
ON rets_property (
    L_Zip,
    L_Keyword2,
    L_SystemPrice
);
```

The index places equality columns first, followed by the price range column.

Existing indexes, including `idx_property_beds_price` and `idx_property_citynorm_price`, were preserved.

### Legacy Schema Compatibility

The `active_check` column is defined as a non-nullable `TIMESTAMP` with a zero-date default (`0000-00-00 00:00:00`).

MySQL's strict SQL mode initially prevented the index creation.

For the local development database, the SQL mode was temporarily relaxed for the active session, the index was created, and the original SQL mode was immediately restored.

No permanent global SQL mode change was made.

## 6. Performance After Optimization

The optimizer selected `idx_property_zip_beds_price`.

`EXPLAIN` reported:

- Access type: `range`
- Index: `idx_property_zip_beds_price`
- Estimated rows: 102
- Extra: `Using index condition; Using filesort`

`EXPLAIN ANALYZE` reported:

- Execution method: Composite index range scan
- Index rows scanned: 102
- Final rows returned: 20
- Execution time: 1.08 ms
- Additional sorting: Still required

## 7. Before vs. After Comparison

| Metric | Before | After |
|---|---:|---:|
| Execution time | 4.15 ms | 1.08 ms |
| Index rows read | 232 | 102 |
| Final rows returned | 20 | 20 |
| Index used | `idx_L_Zip` | `idx_property_zip_beds_price` |

**Observed results:**

- Execution time decreased by approximately 74.0%.
- The benchmark query ran approximately 3.84 times faster.
- Index rows read decreased by approximately 56.0%.

These measurements are from individual `EXPLAIN ANALYZE` runs. Additional repeated measurements would be needed to establish stable performance characteristics across different workloads.

## 8. Additional Week 9 Improvements

### Backend

- Implemented natural language search using the Anthropic Claude API.
- Added JSON Schema-based structured outputs and server-side validation.
- Reused SQL query-building logic across traditional and AI searches.
- Preserved parameterized SQL queries.
- Implemented helpful responses for invalid, vague, and unsuccessful searches.
- Logged HTTP methods, paths, response statuses, and request durations.

### Frontend

- Added an AI Property Search page.
- Reused existing property cards and image components.
- Displayed AI-interpreted search filters.
- Added loading, empty-result, and error states.
- Added a React Error Boundary.

## 9. Testing and Verification

- Backend: 40 tests passed across 3 test suites.
- Frontend: 36 tests passed across 7 test suites.
- React production build: Successful.
- MySQL composite index creation: Successful.
- MySQL SQL mode restoration: Verified.
- Natural language search: Verified against actual property listings.
- Request duration logging: Verified.

The production build displayed a Node.js deprecation warning originating from the `react-dev-utils` dependency (`fs.F_OK`). The warning did not prevent successful compilation.

## 10. Conclusion

Week 9 successfully introduced AI-powered natural language property search and improved database query performance.

For the selected benchmark, the new composite index reduced execution time from 4.15 ms to 1.08 ms and reduced index rows read from 232 to 102.

The implementation preserves the existing property search functionality, provides structured AI input validation, and includes automated tests and error handling.

Future improvements could include additional workload benchmarks, optimization of `ORDER BY` operations, and a dedicated migration strategy for the legacy database schema.
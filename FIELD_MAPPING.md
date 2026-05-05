# UI Fields to Database Mapping

## Problem
Jobs created in the UI weren't being saved to Azure SQL, likely because the database schema is missing required columns.

## Solution
The file `server/db/add-missing-columns.sql` contains a migration script that will add all missing columns to the Jobs table.

---

## Complete Field Mapping

### Fields Sent from UI (CreateJob.tsx)
The form submits these fields when creating a job:

| UI Field | API Name | Data Type | Required | Notes |
|----------|----------|-----------|----------|-------|
| Job Number | reference | string | Auto-generated | Unique identifier |
| Created Date | createdAt | ISO string | Auto-generated | Timestamp |
| Service Type | shuttlerSubType | string | Conditional | Only for SHUTTLER jobs ← USER'S CONCERN |
| Job Type | type | ENUM | ✓ | SHUTTLER or WORKSHOP |
| Priority | priority | ENUM | Yes | LOW, STANDARD, HIGH, CRITICAL |
| Vehicle | vehicle_id | UUID | ✓ | References Vehicles table |
| Company | company | string | ✓ | Client name |
| Contact Person | contact_person | string | Optional | From sales_person or contact_person |
| Contact Number | contact_number | string | Optional | Phone number |
| Address | address | string | Optional | Delivery/job location |
| Job Date | job_date | ISO date | Yes | When the job happens |
| Job Time | job_time | string | Optional | Time window |
| Location | location | string | Conditional | SHUTTLER only |
| Destination | destination | string | Conditional | SHUTTLER only |
| Job Scope | job_scope | string | Conditional | WORKSHOP only |
| Vehicle Out # | vehicle_number_out | string | Optional | Odometer reading |
| Vehicle In # | vehicle_number_in | string | Optional | Return odometer reading |
| Remarks | remarks | string | Optional | Dispatcher notes |

---

### Expected Azure SQL Jobs Table Columns

After the migration runs, your Jobs table should have:

```
id                  NVARCHAR(36)  PRIMARY KEY
reference           NVARCHAR(50)  UNIQUE
type                NVARCHAR(20)
shuttlerSubType     NVARCHAR(100) ← SERVICE TYPE FIELD
status              NVARCHAR(20)
priority            NVARCHAR(20)
vehicleId           NVARCHAR(36)  FOREIGN KEY
requesterId         NVARCHAR(36)  FOREIGN KEY
driverId            NVARCHAR(36)  FOREIGN KEY
workshopAdviserId   NVARCHAR(36)  FOREIGN KEY
bayId               NVARCHAR(36)  FOREIGN KEY
company             NVARCHAR(255)
contactPerson       NVARCHAR(255)
contactNumber       NVARCHAR(100)
address             NVARCHAR(500)
jobDate             DATETIME2
jobTime             NVARCHAR(50)
pickupTime          NVARCHAR(50)
location            NVARCHAR(500)
destination         NVARCHAR(500)
workScope           NVARCHAR(MAX)
vehicleNumberOut    NVARCHAR(100)
vehicleNumberIn     NVARCHAR(100)
driverNote          NVARCHAR(MAX)
workPerformed       NVARCHAR(MAX)
instructions        NVARCHAR(MAX)
remarks             NVARCHAR(MAX)
eta                 NVARCHAR(100)
checklist           NVARCHAR(MAX)
createdAt           DATETIME2
```

---

## How to Apply the Migration

### Step 1: Run the Migration Script

**Option A: Azure Portal Query Editor (Easiest)**
1. Go to https://portal.azure.com
2. Find your SQL Database
3. Click **Query editor** (or Search → SQL databases)
4. Open `server/db/add-missing-columns.sql` in your local editor
5. Copy all the SQL code
6. Paste into Azure Portal Query editor
7. Click **Run**
8. Check the output to see which columns were added

**Option B: SQL Server Management Studio**
1. Connect to your Azure SQL database
2. Open `server/db/add-missing-columns.sql`
3. Click **Execute** (F5)

**Option C: Azure Data Studio**
1. Connect to your Azure SQL database
2. File → Open → `server/db/add-missing-columns.sql`
3. Click **Run**

---

## Step 2: Verify the Migration

After running, execute this query to confirm all columns exist:

```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Jobs'
ORDER BY ORDINAL_POSITION;
```

Expected result: ~25 rows including `shuttlerSubType`, `location`, `destination`, `workScope`, etc.

---

## Step 3: Test Job Creation

1. Start your development server: `npm run dev`
2. Log in as a **Requester**
3. Click **New Request**
4. Fill the form:
   - **Job Type**: SHUTTLER
   - **Service Type**: Airport Run
   - **Vehicle**: Select one
   - **Company**: Acme Corp
   - **Address**: 123 Main St
   - **Job Date**: Today
   - **Location**: Downtown
   - **Destination**: Airport Terminal
5. Click **Submit**
6. You should see a **Success** page with the Job Number and Created Date

---

## Step 4: Verify in Job List

1. Go back to **Requester Hub**
2. You should see your newly created job in the "Recent Requests" list
3. Click the job to view details in **Job Detail** page
4. All fields should display correctly

---

## Troubleshooting

### Migration Script Says "Column Already Exists"
This is fine! It means Azure SQL already has some columns. The script only adds what's missing.

### Job Still Doesn't Appear After Submission
1. Open DevTools (F12) → **Network** tab
2. Submit a job
3. Look for the POST request to `/api/jobs`
4. Check the **Response** tab - it should show `{ id, reference, createdAt }`
5. If there's an error, it will show there
6. Check the console tab for error messages

### "Field not found" Error in Job List
The database schema is out of sync. Make sure you:
1. Ran the migration script
2. Saw "Added [column] column" messages in the output
3. Restarted your dev server after running the migration (`npm run dev`)

### Jobs Appear But Service Type is Blank
The `shuttlerSubType` column now exists, but old jobs won't have data in it. Create a **new** job to test - it should save the service type correctly.

---

## Why This Happened

The `schema.sql` file in your git repo defines the complete database structure, but when your Azure SQL database was initially created, it may not have been fully initialized with all columns. This migration script brings the actual Azure SQL schema into alignment with the complete schema definition.

---

## Reference: Complete Schema Definition

See `server/db/schema.sql` for the authoritative schema definition that Azure SQL should match.

After the migration completes, your Jobs table structure should match the definition in that file.

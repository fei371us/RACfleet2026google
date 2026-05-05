-- Migration to add missing columns to Jobs table
-- This script safely adds only columns that don't already exist
-- Run this manually against Azure SQL Database

-- First: Check current Jobs table structure
PRINT '===== Current Jobs Table Structure =====';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Jobs'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '===== Adding missing columns =====';

-- Add missing columns one by one (IF NOT EXISTS pattern for SQL Server)
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'shuttlerSubType'
)
BEGIN
  ALTER TABLE Jobs ADD shuttlerSubType NVARCHAR(100) NULL;
  PRINT 'Added shuttlerSubType column';
END
ELSE
  PRINT 'shuttlerSubType column already exists';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'location'
)
BEGIN
  ALTER TABLE Jobs ADD location NVARCHAR(500) NULL;
  PRINT 'Added location column';
END
ELSE
  PRINT 'location column already exists';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'destination'
)
BEGIN
  ALTER TABLE Jobs ADD destination NVARCHAR(500) NULL;
  PRINT 'Added destination column';
END
ELSE
  PRINT 'destination column already exists';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'vehicleNumberOut'
)
BEGIN
  ALTER TABLE Jobs ADD vehicleNumberOut NVARCHAR(100) NULL;
  PRINT 'Added vehicleNumberOut column';
END
ELSE
  PRINT 'vehicleNumberOut column already exists';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'vehicleNumberIn'
)
BEGIN
  ALTER TABLE Jobs ADD vehicleNumberIn NVARCHAR(100) NULL;
  PRINT 'Added vehicleNumberIn column';
END
ELSE
  PRINT 'vehicleNumberIn column already exists';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'jobTime'
)
BEGIN
  ALTER TABLE Jobs ADD jobTime NVARCHAR(50) NULL;
  PRINT 'Added jobTime column';
END
ELSE
  PRINT 'jobTime column already exists';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'pickupTime'
)
BEGIN
  ALTER TABLE Jobs ADD pickupTime NVARCHAR(50) NULL;
  PRINT 'Added pickupTime column';
END
ELSE
  PRINT 'pickupTime column already exists';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'workScope'
)
BEGIN
  ALTER TABLE Jobs ADD workScope NVARCHAR(MAX) NULL;
  PRINT 'Added workScope column';
END
ELSE
  PRINT 'workScope column already exists';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'driverNote'
)
BEGIN
  ALTER TABLE Jobs ADD driverNote NVARCHAR(MAX) NULL;
  PRINT 'Added driverNote column';
END
ELSE
  PRINT 'driverNote column already exists';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'workPerformed'
)
BEGIN
  ALTER TABLE Jobs ADD workPerformed NVARCHAR(MAX) NULL;
  PRINT 'Added workPerformed column';
END
ELSE
  PRINT 'workPerformed column already exists';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'instructions'
)
BEGIN
  ALTER TABLE Jobs ADD instructions NVARCHAR(MAX) NULL;
  PRINT 'Added instructions column';
END
ELSE
  PRINT 'instructions column already exists';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'remarks'
)
BEGIN
  ALTER TABLE Jobs ADD remarks NVARCHAR(MAX) NULL;
  PRINT 'Added remarks column';
END
ELSE
  PRINT 'remarks column already exists';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'eta'
)
BEGIN
  ALTER TABLE Jobs ADD eta NVARCHAR(100) NULL;
  PRINT 'Added eta column';
END
ELSE
  PRINT 'eta column already exists';

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs' AND COLUMN_NAME = 'checklist'
)
BEGIN
  ALTER TABLE Jobs ADD checklist NVARCHAR(MAX) NULL;
  PRINT 'Added checklist column';
END
ELSE
  PRINT 'checklist column already exists';

PRINT '';
PRINT '===== Final Jobs Table Structure =====';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Jobs'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT 'Migration complete!';

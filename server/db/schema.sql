-- Run once against your Azure SQL Database to initialize the schema.
-- Safe to re-run; each block checks before creating.

IF OBJECT_ID('Users', 'U') IS NULL
  CREATE TABLE Users (
    id           NVARCHAR(36)  NOT NULL PRIMARY KEY,
    username     NVARCHAR(100) NOT NULL UNIQUE,
    passwordHash NVARCHAR(255) NOT NULL,
    role         NVARCHAR(50)  NOT NULL,
    name         NVARCHAR(255) NOT NULL,
    createdAt    DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );


IF OBJECT_ID('Vehicles', 'U') IS NULL
  CREATE TABLE Vehicles (
    id             NVARCHAR(36)  NOT NULL PRIMARY KEY,
    name           NVARCHAR(255) NOT NULL,
    plate          NVARCHAR(50)  NOT NULL UNIQUE,
    status         NVARCHAR(50)  NOT NULL DEFAULT 'active',
    lastInspection DATETIME2     NULL,
    lat            FLOAT         NOT NULL DEFAULT 0,
    lng            FLOAT         NOT NULL DEFAULT 0
  );


IF OBJECT_ID('WorkshopBays', 'U') IS NULL
  CREATE TABLE WorkshopBays (
    id           NVARCHAR(36)  NOT NULL PRIMARY KEY,
    name         NVARCHAR(255) NOT NULL UNIQUE,
    category     NVARCHAR(100) NOT NULL,
    status       NVARCHAR(50)  NOT NULL DEFAULT 'available',
    currentJobId NVARCHAR(36)  NULL,
    technician   NVARCHAR(255) NULL
  );


IF OBJECT_ID('Jobs', 'U') IS NULL
  CREATE TABLE Jobs (
    id                NVARCHAR(36)  NOT NULL PRIMARY KEY,
    reference         NVARCHAR(50)  NOT NULL UNIQUE,
    type              NVARCHAR(20)  NOT NULL,
    status            NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    priority          NVARCHAR(20)  NOT NULL DEFAULT 'STANDARD',
    vehicleId         NVARCHAR(36)  NULL REFERENCES Vehicles(id),
    requesterId       NVARCHAR(36)  NULL REFERENCES Users(id),
    driverId          NVARCHAR(36)  NULL REFERENCES Users(id),
    workshopAdviserId NVARCHAR(36)  NULL REFERENCES Users(id),
    bayId             NVARCHAR(36)  NULL REFERENCES WorkshopBays(id),
    company           NVARCHAR(255) NULL,
    contactPerson     NVARCHAR(255) NULL,
    contactNumber     NVARCHAR(100) NULL,
    address           NVARCHAR(500) NULL,
    jobDate           DATETIME2     NULL,
    jobTime           NVARCHAR(50)  NULL,
    pickupTime        NVARCHAR(50)  NULL,
    location          NVARCHAR(500) NULL,
    destination       NVARCHAR(500) NULL,
    workScope         NVARCHAR(MAX) NULL,
    vehicleNumberOut  NVARCHAR(100) NULL,
    vehicleNumberIn   NVARCHAR(100) NULL,
    driverNote        NVARCHAR(MAX) NULL,
    workPerformed     NVARCHAR(MAX) NULL,
    instructions      NVARCHAR(MAX) NULL,
    remarks           NVARCHAR(MAX) NULL,
    eta               NVARCHAR(100) NULL,
    checklist         NVARCHAR(MAX) NULL,
    createdAt         DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );


IF OBJECT_ID('InspectionPins', 'U') IS NULL
  CREATE TABLE InspectionPins (
    id        INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    jobId     NVARCHAR(36)  NULL REFERENCES Jobs(id) ON DELETE CASCADE,
    vehicleId NVARCHAR(36)  NULL REFERENCES Vehicles(id),
    x         FLOAT         NOT NULL,
    y         FLOAT         NOT NULL,
    type      NVARCHAR(50)  NOT NULL,
    note      NVARCHAR(MAX) NULL,
    photoUrl  NVARCHAR(MAX) NULL,
    createdAt DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );

import wildCardOrigin from "../helper/checkOrigin";
import { CallbackFunction } from "../helper/types";
// Purpose: Configuration file for the project.
// Note: This is a sample configuration file. Modify this file to fit your project's needs.

// Configuration object
export const config = {
  // PORT
  PORT: 8080,

  // Bcrypt configuration
  BCRYPT: {
    SALT_ROUNDS: 10,
  },

  // Welcome Message
  MSG: {
    WELCOME: "You're successfully connected to UNLAD TEMPLATE API.",
  },

  // Success messages
  SUCCESS: {
    SERVER: "Server is running on port:",
    DATABASE: "Database connected:",

    USER: {
      REGISTER: "User registered successfully",
      LOGIN: "Login successful",
      UPDATE: "User update successful",
      DELETE: "Delete successful",
      ARCHIVE: "User archived successfully",
      LOGOUT: "Logout successful, token cleared.",
      CREATE: "User created successfully",
      GET_ALL: "Users retrieved successfully",
      GET_BY_ID: "User retrieved successfully",
      METRICS: "User metrics retrieved successfully",
      BULK_CREATE: "Users created successfully",
    },
    STUDENT: {
      UPDATE: "Student update successful",
      DELETE: "Delete successful",
      ARCHIVE: "Student archived successfully",
      LOGOUT: "Logout successful, token cleared.",
      CREATE: "Student created successfully",
      GET_ALL: "Students retrieved successfully",
      GET_BY_ID: "Student retrieved successfully",
      BULK_IMPORT: "Students imported successfully",
    },
    INSTRUCTOR: {
      UPDATE: "Instructor update successful",
      DELETE: "Delete successful",
      ARCHIVE: "Instructor archived successfully",
      LOGOUT: "Logout successful, token cleared.",
      CREATE: "Instructor created successfully",
      GET_ALL: "Instructors retrieved successfully",
      GET_BY_ID: "Instructor retrieved successfully",
      BULK_IMPORT: "Instructors imported successfully",
    },
    SECTION: {
      UPDATE: "Section update successful",
      DELETE: "Delete successful",
      ARCHIVE: "Section archived successfully",
      LOGOUT: "Logout successful, token cleared.",
      CREATE: "Section created successfully",
      GET_ALL: "Sections retrieved successfully",
      GET_BY_ID: "Section retrieved successfully",
      BULK_ADD_STUDENTS: "Students added to section successfully",
      GET_INSTRUCTOR_SECTIONS: "Instructor sections retrieved successfully",
      GET_STUDENT_SECTIONS: "Student sections retrieved successfully",
      REMOVE_STUDENT: "Student removed from section successfully",
      GENERATE_CODE: "Section code generated successfully",
    },
    ORGANIZATION: {
      UPDATE: "Organization update successful",
      DELETE: "Delete successful",
      ARCHIVE: "Organization archived successfully",
      LOGOUT: "Logout successful, token cleared.",
      CREATE: "Organization created successfully",
      GET_ALL: "Organizations retrieved successfully",
      GET_BY_ID: "Organization retrieved successfully",
      GENERATE_CODE: "Code generated successfully",
    },
    MODULE: {
      UPDATE: "Module update successful",
      DELETE: "Delete successful",
      ARCHIVE: "Module archived successfully",
      LOGOUT: "Logout successful, token cleared.",
      CREATE: "Module created successfully",
      GET_ALL: "Modules retrieved successfully",
      GET_BY_ID: "Module retrieved successfully",
      BULK_IMPORT: "Modules imported successfully",
    },
    LESSON: {
      UPDATE: "Lesson update successful",
      DELETE: "Delete successful",
      ARCHIVE: "Lesson archived successfully",
      LOGOUT: "Logout successful, token cleared.",
      CREATE: "Lesson created successfully",
      GET_ALL: "Lessons retrieved successfully",
      GET_BY_ID: "Lesson retrieved successfully",
    },
    COURSE: {
      UPDATE: "Course update successful",
      DELETE: "Delete successful",
      ARCHIVE: "Course archived successfully",
      LOGOUT: "Logout successful, token cleared.",
      CREATE: "Course created successfully",
      GET_ALL: "Courses retrieved successfully",
      GET_BY_ID: "Course retrieved successfully",
    },
    ASSESSMENT: {
      UPDATE: "Assessment update successful",
      DELETE: "Delete successful",
      ARCHIVE: "Assessment archived successfully",
      LOGOUT: "Logout successful, token cleared.",
      CREATE: "Assessment created successfully",
      GET_ALL: "Assessments retrieved successfully",
      GET_BY_ID: "Assessment retrieved successfully",
      GET_SECTION_STUDENTS: "Assessment students retrieved successfully",
    },
    AUDIT_LOG: {
      CREATE: "Audit log created successfully",
      UPDATE: "Audit log updated successfully",
      DELETE: "Audit log deleted successfully",
      ARCHIVE: "Audit log archived successfully",
      GET: "Audit log retrieved successfully",
      GET_ALL: "Audit logs retrieved successfully",
    },
    ACTIVITY_LOG: {
      CREATE: "Activity log created successfully",
      UPDATE: "Activity log updated successfully",
      DELETE: "Activity log deleted successfully",
      ARCHIVE: "Activity log archived successfully",
      GET: "Activity log retrieved successfully",
      GET_ALL: "Activity logs retrieved successfully",
    },
    GRADES: {
      UPDATE: "Grades update successful",
      DELETE: "Delete successful",
      ARCHIVE: "Grades archived successfully",
      LOGOUT: "Logout successful, token cleared.",
      CREATE: "Grades created successfully",
      GET_ALL: "Grades retrieved successfully",
      GET_BY_ID: "Grades retrieved successfully",
    },
    ATTENDANCE: {
      UPDATE: "Attendance update successful",
      DELETE: "Delete successful",
      ARCHIVE: "Attendance archived successfully",
      CREATE: "Attendance created successfully",
      GET_ALL: "Attendance records retrieved successfully",
      GET_BY_ID: "Attendance record retrieved successfully",
    },
    CHECKLIST_TEMPLATE: {
      CREATE: "Checklist template created successfully",
      GET_ALL: "Checklist templates retrieved successfully",
      GET_BY_ID: "Checklist template retrieved successfully",
      UPDATE: "Checklist template updated successfully",
      ARCHIVE: "Checklist template archived successfully",
      ADD_ITEM: "Checklist item added successfully",
      UPDATE_ITEM: "Checklist item updated successfully",
      REMOVE_ITEM: "Checklist item removed successfully",
    },
    EMPLOYEE_CHECKLIST: {
      CREATE: "Checklist assigned successfully",
      GET_ALL: "Employee checklists retrieved successfully",
      GET_BY_ID: "Employee checklist retrieved successfully",
      UPDATE: "Employee checklist updated successfully",
      ARCHIVE: "Employee checklist archived successfully",
    },
    ANNOUNCEMENT: {
      UPDATE: "Announcement update successful",
      DELETE: "Delete successful",
      ARCHIVE: "Announcement archived successfully",
      CREATE: "Announcement created successfully",
      GET_ALL: "Announcements retrieved successfully",
      GET_BY_ID: "Announcement retrieved successfully",
    },
    NOTIFICATION: {
      MARK_AS_READ: "Notification marked as read",
      ARCHIVE: "Notification archived successfully",
      GET_ALL: "Notifications retrieved successfully",
      GET_BY_ID: "Notification retrieved successfully",
    },
    CLOUDINARY: {
      UPLOAD: "File uploaded successfully",
      DELETE: "File deleted successfully",
    },
  },

  STATUS: {
    VALIDATION_ERROR: {
      CODE: 400,
      TITLE: "Validation error",
    },
    UNAUTHORIZED: {
      CODE: 401,
      TITLE: "Unauthorized",
    },
    FORBIDDEN: {
      CODE: 403,
      TITLE: "Forbidden",
    },
    NOT_FOUND: {
      CODE: 404,
      TITLE: "Not found",
    },
    SERVER_ERROR: {
      CODE: 500,
      TITLE: "Server error",
    },
    DEFAULT_ERROR: {
      TITLE: "Unexpected error",
      CODE: 500,
      UNEXPECTED: "An unexpected error occurred. Please try again later.",
    },
  },

  CORS: {
    METHODS: ["GET", "POST", "PUT", "DELETE"],
    LOCAL: function (origin: string, callback: CallbackFunction) {
      wildCardOrigin(
        origin,
        callback,
        "http://localhost:5173",
        "http://localhost:5181"
      );
    },
    DEV_SITE: function (origin: string, callback: CallbackFunction) {
      wildCardOrigin(
        origin,
        callback,
        "https://lms-app-dev-1f189.web.app",
        "https://lms-app-dev.site",
        "https://mediatrix-lms-app-dev.web.app",
        "https://mediatrix-performance-app-dev.web.app",
        "https://mediatrix-lms-app.web.app",
        "https://mediatrix-performance-app.web.app"
      );
    },
    TEST_SITE: function (origin: string, callback: CallbackFunction) {
      wildCardOrigin(
        origin,
        callback,
        "https://lms-app-test-bffd3.web.app",
        "https://lms-app-test.site"
      );
    },
  },

  // *Change the cloudinary services.
  CLOUDINARY: {
    CLOUD_NAME: "dyal0wstg",
    API_KEY: "121984878512267",
    API_SECRET: "_lmlRIHFCr2baHJDjW13mbWwexs",
  },

  DB: {
    // Change this to your MongoDB URI
    // URI: "mongodb+srv://1bissolutionstech:IH8RXzPdWkByn7kI@lms-api.wuxbw.mongodb.net/test?retryWrites=true&w=majority&appName=lms-api",
    URI: "mongodb+srv://1bissolutionstech:IH8RXzPdWkByn7kI@lms-api.wuxbw.mongodb.net/dev-v2?retryWrites=true&w=majority&appName=lms-api",
    COLLECTION: "sessions",
  },

  EMAILCONFIG: {
    INVITATION: {
      URL: process.env.INVITATION_URL || "http://localhost:5173/invitation",
      EXPIRY_MILLISECONDS: 24 * 60 * 60 * 7 * 1000,
      IV_LENGTH: 16,
    },
  },

  JWTCONFIG: {
    // Change this to your JWT secret
    SECRET: "s@mple",
    BEARER_REGEX: /^Bearer\s+(\S+)$/,
    ADMIN_EXPIRESIN: "1d",
    EXPIRESIN: "1h",
    CLEAR_COOKIE: "jwt",
    NODE_ENV: "production",
  },

  // Error messages
  ERROR: {
    MONGODB_NOT_DEFINE: "MONGODB_URI is not defined in the environment variables.",
    CONNECTION_FAILED: "Database connection failed:",
    UNEXPECTED: "An unexpected error occurred. Please try again later.",
    RATELIMIT: "Too many requests from this IP, please try again after 15 minutes",
    NO_DEACTIVE_USERS: "No users to deactivate",
    NO_ARCHIVE_USERS: "No users to archive",
    CORS: "Not allowed by cors",

    // User error messages
    USER: {
      NOT_AUTHORIZED: "User is not authorized",
      NOT_FOUND: "User not found",
      INVALID_CREDENTIALS: "Invalid credentials",
      INVALID_TOKEN: "Invalid token.",
      EMAIL_ALREADY_EXISTS: "Email already exists",
      NO_ACCOUNT: "No account found with this email. Please register.",
      ARCHIVED: "No account found with this email. Please register.",
      INVALID_EMAIL: "Invalid email format",
      REQUIRED_FIELDS: "Both email and password are required.",
      ALREADY_EXIST: "User already exists",
      UPDATE_FAILED: "An error occurred during the update.",
      INVALID_ID: "Invalid user ID",
      DEACTIVATED: "User is deactivated, because of inactivity",
      NO_ID: "No user ID provided",
      INVALID_OLD_PASSWORD: "Invalid old password",
      INVALID_PASSWORD: "Invalid password",
      SAME_PASSWORD: "New password cannot be the same as the old password",
    },
    NOTIFICATION: {
      NO_ID: "Notification ID is required",
      INVALID_PARAMETER: "Invalid parameters provided",
      REQUIRED_FIELDS: "Required fields are missing",
    },
    COURSE_LEVEL: ["Beginner", "Intermediate", "Advanced", "Expert"],
  },

  // User roles
  METHOD: {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    DELETE: "DELETE",
  },

  // Validation Constants
  VALIDATION: {
    USER: {
      EMAIL: "email",
      PASSWORD: "password",
      ID: "id",
    },
  },

  // Response messages
  RESPONSE: {
    ERROR: {
      INTERNAL_SERVER_ERROR: "Internal server error",
      USER: {
        ID: "userId is missing!",
        NOT_FOUND: "User not found",
        REMOVE: "Error removing user",
        UPDATE: "Error updating user",
        ALREADY_EXISTS: "User already exists",
        NOT_FOUND_ID: "User not found! with the provided _id",
        INVALID_PARAMETER: {
          GET: "userService.get params is missing!",
          GET_ALL: "userService.getAllField params is missing!",
          CREATE: "userService.create params is missing!",
          UPDATE: "userService.update params is missing!",
          ID: "userService.update params._id is missing!",
          REMOVE: "userService.remove params is missing!",
          SEARCH: "userService.search params is missing!",
          LOGIN: "userService.login params is missing!",
        },
      },
      PERSON: {
        ID: "personId is missing!",
        NOT_FOUND: "person not found",
        REMOVE: "Error removing product",
        UPDATE: "Error updating product",
        ALREADY_EXISTS: "Person already exists",
        NOT_FOUND_ID: "Person not found! with the provided _id",
        INVALID_PARAMETER: {
          GET: "personService.get params is missing!",
          GET_ALL: "personService.getAllField params is missing!",
          CREATE: "personService.create params is missing!",
          UPDATE: "personService.update params is missing!",
          ID: "personService.update params._id is missing!",
          REMOVE: "personService.remove params is missing!",
          SEARCH: "personService.search params is missing!",
        },
      },
      ORGANIZATION: {
        ID: "organizationId is missing!",
        NOT_FOUND: "Organization not found",
        REMOVE: "Error removing product",
        UPDATE: "Error updating product",
        ALREADY_EXISTS: "Organization already exists",
        NOT_FOUND_ID: "Organization not found! with the provided _id",
        INVALID_PARAMETER: {
          GET: "OrganizationService.get params is missing!",
          GET_ALL: "OrganizationService.getAllField params is missing!",
          CREATE: "OrganizationService.create params is missing!",
          UPDATE: "OrganizationService.update params is missing!",
          ID: "OrganizationService.update params._id is missing!",
          REMOVE: "OrganizationService.remove params is missing!",
          SEARCH: "OrganizationService.search params is missing!",
        },
      },
      COURSE: {
        ID: "courseId is missing!",
        NOT_FOUND: "Course not found",
        REMOVE: "Error removing product",
        UPDATE: "Error updating product",
        ALREADY_EXISTS: "Course already exists",
        NOT_FOUND_ID: "Course not found! with the provided _id",
        INVALID_PARAMETER: {
          GET: "CourseService.get params is missing!",
          GET_ALL: "CourseService.getAllField params is missing!",
          CREATE: "CourseService.create params is missing!",
          UPDATE: "CourseService.update params is missing!",
          ID: "CourseService.update params._id is missing!",
          REMOVE: "CourseService.remove params is missing!",
          SEARCH: "CourseService.search params is missing!",
        },
      },
      STUDENT: {
        ID: "studentId is missing!",
        NOT_FOUND: "Student not found",
        REMOVE: "Error removing product",
        UPDATE: "Error updating product",
        ALREADY_EXISTS: "Student already exists",
        NOT_FOUND_ID: "Student not found! with the provided _id",
        GRADES_BY_SECTION: "Error getting grades by section",
        INVALID_PARAMETER: {
          GET: "StudentService.get params is missing!",
          GET_ALL: "StudentService.getAllField params is missing!",
          CREATE: "StudentService.create params is missing!",
          UPDATE: "StudentService.update params is missing!",
          ID: "StudentService.update params._id is missing!",
          REMOVE: "StudentService.remove params is missing!",
          SEARCH: "StudentService.search params is missing!",
        },
      },
      INSTRUCTOR: {
        ID: "instructorId is missing!",
        NOT_FOUND: "Instructor not found",
        REMOVE: "Error removing product",
        UPDATE: "Error updating product",
        ALREADY_EXISTS: "Instructor already exists",
        NOT_FOUND_ID: "Instructor not found! with the provided _id",
        INVALID_PARAMETER: {
          GET: "InstructorService.get params is missing!",
          GET_ALL: "InstructorService.getAllField params is missing!",
          CREATE: "InstructorService.create params is missing!",
          UPDATE: "InstructorService.update params is missing!",
          ID: "InstructorService.update params._id is missing!",
          REMOVE: "InstructorService.remove params is missing!",
          SEARCH: "InstructorService.search params is missing!",
        },
      },
      PROGRAM: {
        ID: "programId is missing!",
        NOT_FOUND: "Program not found",
        REMOVE: "Error removing product",
        UPDATE: "Error updating product",
        ALREADY_EXISTS: "Program already exists",
        NOT_FOUND_ID: "Program not found! with the provided _id",
        INVALID_PARAMETER: {
          GET: "ProgramService.get params is missing!",
          GET_ALL: "ProgramService.getAllField params is missing!",
          CREATE: "ProgramService.create params is missing!",
          UPDATE: "ProgramService.update params is missing!",
          ID: "ProgramService.update params._id is missing!",
          REMOVE: "ProgramService.remove params is missing!",
          SEARCH: "ProgramService.search params is missing!",
        },
      },
      SECTION: {
        ID: "sectionId is missing!",
        NOT_FOUND: "Section not found",
        REMOVE: "Error removing product",
        UPDATE: "Error updating product",
        ALREADY_EXISTS: "Section already exists",
        NOT_FOUND_ID: "Section not found! with the provided _id",
        INVALID_PARAMETER: {
          GET: "SectionService.get params is missing!",
          GET_ALL: "SectionService.getAllField params is missing!",
          CREATE: "SectionService.create params is missing!",
          UPDATE: "SectionService.update params is missing!",
          ID: "SectionService.update params._id is missing!",
          REMOVE: "SectionService.remove params is missing!",
          SEARCH: "SectionService.search params is missing!",
        },
      },
      LESSON: {
        ID: "lessonId is missing!",
        NOT_FOUND: "Lesson not found",
        REMOVE: "Error removing product",
        UPDATE: "Error updating product",
        ALREADY_EXISTS: "Lesson already exists",
        NOT_FOUND_ID: "Lesson not found! with the provided _id",
        INVALID_PARAMETER: {
          GET: "LessonService.get params is missing!",
          GET_ALL: "LessonService.getAllField params is missing!",
          CREATE: "LessonService.create params is missing!",
          UPDATE: "LessonService.update params is missing!",
          ID: "LessonService.update params._id is missing!",
          REMOVE: "LessonService.remove params is missing!",
          SEARCH: "LessonService.search params is missing!",
        },
      },
      MODULE: {
        ID: "moduleId is missing!",
        NOT_FOUND: "Module not found",
        REMOVE: "Error removing product",
        UPDATE: "Error updating product",
        ALREADY_EXISTS: "Module already exists",
        NOT_FOUND_ID: "Module not found! with the provided _id",
        INVALID_PARAMETER: {
          GET: "ModuleService.get params is missing!",
          GET_ALL: "ModuleService.getAllField params is missing!",
          CREATE: "ModuleService.create params is missing!",
          UPDATE: "ModuleService.update params is missing!",
          ID: "ModuleService.update params._id is missing!",
          REMOVE: "ModuleService.remove params is missing!",
          SEARCH: "ModuleService.search params is missing!",
        },
      },
      AUDIT_LOG: {
        INVALID_PARAMETER: {
          GET: "Invalid parameters for getting audit log",
          GET_ALL: "Invalid parameters for getting all audit logs",
          CREATE: "Invalid parameters for creating audit log",
          UPDATE: "Invalid parameters for updating audit log",
          DELETE: "Invalid parameters for deleting audit log",
        },
        NOT_FOUND: "Audit log not found",
      },
      ACTIVITY_LOG: {
        INVALID_PARAMETER: {
          GET: "Invalid parameters for getting activity log",
          GET_ALL: "Invalid parameters for getting all activity logs",
          CREATE: "Invalid parameters for creating activity log",
          UPDATE: "Invalid parameters for updating activity log",
          DELETE: "Invalid parameters for deleting activity log",
        },
        NOT_FOUND: "Activity log not found",
      },
      ATTENDANCE: {
        ID: "attendanceId is missing!",
        NOT_FOUND: "Attendance not found",
        REMOVE: "Error removing attendance",
        UPDATE: "Error updating attendance",
        ALREADY_EXISTS: "Attendance already exists",
        NOT_FOUND_ID: "Attendance not found! with the provided _id",
        INVALID_PARAMETER: {
          GET: "AttendanceService.get params is missing!",
          GET_ALL: "AttendanceService.getAllField params is missing!",
          CREATE: "AttendanceService.create params is missing!",
          UPDATE: "AttendanceService.update params is missing!",
          ID: "AttendanceService.update params._id is missing!",
          REMOVE: "AttendanceService.remove params is missing!",
          SEARCH: "AttendanceService.search params is missing!",
        },
      },
      CHECKLIST_TEMPLATE: {
        ID: "Checklist template ID is required",
        NOT_FOUND: "Checklist template not found",
        INVALID_PARAMETER: {
          GET: "Invalid parameters for getting checklist template",
          GET_ALL: "Invalid parameters for getting checklist templates",
          CREATE: "Invalid parameters for creating checklist template",
          UPDATE: "Invalid parameters for updating checklist template",
          REMOVE: "Invalid parameters for removing checklist template",
        },
      },
      EMPLOYEE_CHECKLIST: {
        ID: "Employee checklist ID is required",
        NOT_FOUND: "Employee checklist not found",
        DUPLICATE: "This employee already has an active checklist for this template",
        INVALID_PARAMETER: {
          GET: "Invalid parameters for getting employee checklist",
          GET_ALL: "Invalid parameters for getting employee checklists",
          CREATE: "Invalid parameters for creating employee checklist",
          UPDATE: "Invalid parameters for updating employee checklist",
          REMOVE: "Invalid parameters for removing employee checklist",
        },
      },
    },
  },

  // Cron job configuration
  CRON: {
    CLEAN_UP: {
      INACTIVE_USERS: {
        TIME: "0 0 1 * *",
        MESSAGE: "Running clean up job for inactive users",
      },
      INACTIVE_USERS_DEACTIVATE_THRESHOLD: 6, // 6 months
      INACTIVE_USERS_ARCHIVE_THRESHOLD: 1, // 1 year
    },
  },
  ENUM: {
    ANNOUNCEMENT: {
      SCOPE: ["system", "organization", "course", "section", "lesson", "module"] as const,
    },
    ASSESSMENT: {
      TYPE: ["quiz", "exam", "assignment", "activity"] as const,
      CATEGORY: ["daily", "weekly", "monthly", "periodical", "finals"] as const,
      GRADEMETHOD: ["manual", "auto", "mixed"] as const,
      QUESTION_TYPE: [
        "multiple_choice",
        "enumeration",
        "essay",
        "true_false",
        "fill_in_the_blank",
        "checkbox",
      ] as const,
    },
    ASSIGNMENT: {
      TYPE: [
        "essay",
        "multiple_choice",
        "enumeration",
        "true_false",
        "fill_in_the_blank",
        "project",
        "research_paper",
      ] as const,
      GRADEMETHOD: ["manual", "auto"] as const,
    },
    ATTENDANCE: {
      STATUS: ["present", "late", "absent", "excused"] as const,
    },
    QUESTION: {
      TYPE: ["multiple_choice", "enumeration", "essay", "true_false", "fill_in_the_blank"] as const,
    },
    SECTION: {
      STATUS: ["upcoming", "ongoing", "completed", "cancelled"] as const,
      DAYS: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const,
    },
  },
};

export const GENDERS = [
  "male",
  "female",
  "transgender",
  "gender_neutral",
  "non_binary",
  "agender",
  "pangender",
  "genderqueer",
  "two_spirit",
  "third_gender",
  "other",
] as const;

export const EMPLOYMENT_STATUS = ["regular", "probitionary", "part_time", "retired"] as const;

export const EMPLOYMENT_TYPE = [
  "full_time",
  "part_time",
  "probationary",
  "internship",
  "freelance",
  "temporary",
  "volunteer",
  "retired",
  "resigned",
] as const;
export const USER_STATUS = [
  "active",
  "inactive",
  "suspended",
  "deactivated",
  "archived",
  "withdrawn",
] as const;

export const USER_TYPE = ["admin", "user", "viewer"] as const;

export const USER_ROLE = [
  "superadmin",
  "admin",
  "instructor",
  "employee",
  "student",
  "user",
  "viewer",
] as const;

export const ORGANIZATION_STATUS = [
  "pending",
  "verified",
  "active",
  "inactive",
  "suspended",
  "banned",
  "archived",
  "deleted",
] as const;

export const ORGANIZATION_PLAN = [
  "trial",
  "free",
  "starter",
  "basic",
  "pro",
  "business",
  "premium",
  "enterprise",
  "custom",
] as const;

export const COURSE_LEVEL = ["beginner", "intermediate", "advanced"] as const;

export const COURSE_STATUS = ["draft", "published", "archived"] as const;

export const CIVIL_STATUS = ["married", "separated", "widow", "single", "cohabiting"] as const;

export const ADDRESS_TYPES = ["home", "work", "billing", "shipping", "temporary", "other"] as const;

export const ACTION = {
  CREATE: "create",
  GET_ALL: "getAll",
  GET_BY_ID: "getById",
  UPDATE: "update",
  DELETE: "delete",
  ARCHIVE: "archive",
  SEARCH: "search",
  SEARCH_AND_UPDATE: "searchAndUpdate",
  CUSTOM: "custom",
};

export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  INSTRUCTOR: "instructor",
  STUDENT: "student",
  EMPLOYEE: "employee",
  USER: "user",
  VIEW: "viewer",
};

// NOTE: This file is kept for future notification template usage.
// Types formerly imported from "../helper/interfaces" have been inlined.

type TemplateParams = {
  section: { name: string; [key: string]: any };
  sender?: { firstName?: string; [key: string]: any };
  metadata?: Record<string, any>;
};

type NotificationTemplate = {
  title: (params: TemplateParams) => string;
  description: (params: TemplateParams) => string;
};

const NOTIFICATION_TEMPLATES: Record<string, Record<string, NotificationTemplate>> = {
  ANNOUNCEMENT: {
    NEW: {
      title: ({ section }) => `An announcement from Class ${section.name}`,
      description: ({ sender, metadata }) => {
        const firstName = sender?.firstName || "Someone";
        return `${firstName} has posted a new announcement: "${metadata?.announcement?.title || ""}"`;
      },
    },
    UPDATE: {
      title: ({ section }) => `Announcement updated in ${section.name}`,
      description: ({ sender, metadata }) => {
        const firstName = sender?.firstName || "Someone";
        return `${firstName} has updated an announcement: "${metadata?.announcement?.title || ""}"`;
      },
    },
  },
  ASSESSMENT: {
    NEW: {
      title: ({ section }) => `New assessment from ${section.name}`,
      description: ({ sender, metadata }) => {
        const firstName = sender?.firstName || "Someone";
        return `${firstName} has posted a new assessment: "${metadata?.assessment?.title || ""}"`;
      },
    },
    UPDATED: {
      title: ({ section }) => `Assessment updated in ${section.name}`,
      description: ({ sender, metadata }) => {
        const firstName = sender?.firstName || "Someone";
        const updatedFields = metadata?.updatedFields?.length
          ? `Updated: ${metadata.updatedFields.join(", ")}`
          : "Assessment details have been updated.";
        return `${firstName} has updated an assessment: "${metadata?.assessment?.title || ""}". ${updatedFields}`;
      },
    },
  },
  MODULE: {
    NEW: {
      title: ({ section }) => `A new module has been added to ${section.name}`,
      description: ({ sender, metadata }) => {
        const firstName = sender?.firstName || "Someone";
        return `${firstName} has added a new module: "${metadata?.module?.title || ""}"`;
      },
    },
  },
  LESSON: {
    NEW: {
      title: ({ section }) => `A new lesson has been added to ${section.name}`,
      description: ({ sender, metadata }) => {
        const firstName = sender?.firstName || "Someone";
        return `${firstName} has added a new lesson: "${metadata?.lesson?.title || ""}"`;
      },
    },
  },
  SECTION: {
    INSTRUCTOR: {
      title: ({ section }) => `You have been assigned to a new section: ${section.name}`,
      description: ({ metadata }) =>
        `You are now the instructor for section "${metadata?.section?.name || ""}" code: ${metadata?.section?.code || ""}`,
    },
    STATUS_CHANGE: {
      title: ({ section }) => `The status of ${section.name} has been changed`,
      description: ({ metadata }) =>
        `The status of ${metadata?.section?.name || ""} has been changed to ${metadata?.section?.status || ""}`,
    },
    UPDATE: {
      title: ({ section }) => `Section "${section.name}" has been updated`,
      description: ({ metadata }) => {
        const sectionName = metadata?.section?.name || "";
        const sectionCode = metadata?.section?.code || "";
        return (
          `Details for section "${sectionName}" (code: ${sectionCode}) have been updated.` +
          "Please review the section for the latest information."
        );
      },
    },
  },
};

export default NOTIFICATION_TEMPLATES;

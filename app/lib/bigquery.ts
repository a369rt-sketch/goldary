import { BigQuery } from "@google-cloud/bigquery";

export const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export const dataset = "goldary_analytics";
export const table = "user_calculations";

import type { Deployment } from "../types";

const IN_FLIGHT: Deployment["status"][] = ["QUEUED", "PENDING", "CLONING", "BUILDING", "PUBLISHING"];

export const isInFlight = (status: Deployment["status"]) => IN_FLIGHT.includes(status);

export const isTerminal = (status: Deployment["status"]) => status === "SUCCESS" || status === "FAILED";

// Deploys come newest first.
export const latestDeployment = (deployments: Deployment[] | undefined) => deployments?.[0];

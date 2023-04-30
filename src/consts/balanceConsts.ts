/** How long train sits in station, ms */
export const trainStallTime = 10000;

/** How long train takes to decelerate and accelerate, ms */
export const trainAccelerateTime = 5000;

/** Width of the platform in arbitrary size units */
export const platformWidth = 100;

/** Length of a single train car in arbitrary size units */
export const carLength = 150;

/** Gap in asu between last door and first door of next car */
export const carGap = 30;

/** Walking speed in asu/sec */
export const walkSpeed = 40;

/** How long before a pax deducts health if they miss their train */
export const paxAnnoyTime = 10000;

/** How long for a pax to board the train */
export const paxBoardTime = 1000;

/** How long to wait for pax deboarding each train */
export const paxTotalDeboardTime = 2000;

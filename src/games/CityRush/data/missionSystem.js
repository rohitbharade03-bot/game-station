import {
  getMission,
  MISSIONS,
} from "../data/missions";

export function isMissionUnlocked(
  missionId,
  save
) {
  return save.unlockedMissions.includes(
    missionId
  );
}

export function getCurrentMission(
  save
) {
  return getMission(
    save.currentMission
  );
}

export function getNextMission(
  missionId
) {
  return getMission(
    Math.min(
      missionId + 1,
      MISSIONS.length
    )
  );
}

export function getMissionProgress(
  save
) {
  const completed =
    save.completedMissions.length;

  const total =
    MISSIONS.length;

  return {
    completed,
    total,
    percentage:
      total === 0
        ? 0
        : Math.round(
            (completed / total) *
              100
          ),
  };
}

export function canStartMission(
  missionId,
  save
) {
  return (
    isMissionUnlocked(
      missionId,
      save
    ) &&
    !save.completedMissions.includes(
      missionId
    )
  );
}

export function getObjective(
  mission,
  state
) {
  if (!mission) {
    return null;
  }

  if (
    mission.type === "DELIVERY"
  ) {
    return state.packageCollected
      ? mission.destination
      : mission.pickup;
  }

  if (
    mission.type === "RESCUE"
  ) {
    return state.personCollected
      ? mission.destination
      : mission.pickup;
  }

  if (
    mission.type === "CHAIN" ||
    mission.type === "FINAL"
  ) {
    return (
      mission.checkpoints[
        state.checkpointIndex || 0
      ] || mission.destination
    );
  }

  return mission.destination;
}
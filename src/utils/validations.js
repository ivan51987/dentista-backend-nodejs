exports.isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

exports.isWorkingHour = (date, workingHours) => {
  const dayOfWeek = date.getDay();
  const time = date.getHours() * 60 + date.getMinutes();

  const daySchedule = workingHours[
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek]
  ];

  if (!daySchedule) return false;

  const [startHour, startMinute] = daySchedule.start.split(':').map(Number);
  const [endHour, endMinute] = daySchedule.end.split(':').map(Number);

  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  return time >= startTime && time <= endTime;
};
// "2026-10-12" → その日の0時 と 翌日の0時
export const getDayRange = (dateString) => {
  const start = new Date(`${dateString}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

// "2026-10" → その月の1日の0時 と 翌月の1日の0時
export const getMonthRange = (monthString) => {
  const start = new Date(`${monthString}-01T00:00:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
};

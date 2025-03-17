from datetime import datetime, timedelta
from typing import Optional


def get_sleep_time(time) -> Optional[int]:
    lookup = {"s": 1, "m": 60, "h": 3600}
    time_number, time_sufix = time[:-1], time[-1:]

    if not (time_number.isnumeric() or time_sufix.isalpha()):
        print("Invalid sleep time")
        return None

    return int(time_number) * lookup[time_sufix]


def gen_date_from_now(n_iter, interval="day") -> list:
    result = []
    start = datetime.utcnow()
    if interval == "hour":
        for h in range(0, start.hour):
            result.append(
                {
                    "date": start.strftime(f"%Y-%m-%dT{str(h).zfill(2)}:00:00.000Z"),
                    "value": 0,
                }
            )
        return result

    for day in range(0, n_iter):
        d = start - timedelta(days=day)
        result.append({"date": d.strftime("%Y-%m-%dT00:00:00.000Z"), "value": 0})
        # result.append({'date': d.strftime('%Y-%m-%dT00:00:00.000Z'), 'value': random.randint(0, 2500)})
    return result


def gen_day_from_date(start, offset=5):
    start_date = datetime.strptime(start, "%Y-%m-%d")
    start_date = start_date - timedelta(days=offset)
    days_from_now = datetime.utcnow() - start_date
    dates = []
    for n in range(days_from_now.days + 1):
        day = start_date + timedelta(days=n)
        dates.append({"date": day.strftime("%Y-%m-%d"), "value": 0})
    return dates

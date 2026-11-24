"""
QueuePulse AI - Synthetic Queue Dataset Generator
Simulates realistic queuing dynamics using M/M/c approximation, peak-hour multipliers,
service variability, and crowd reporting surges.

DISCLAIMER:
This dataset is synthetically generated for demonstration, development, and algorithmic validation.
Metrics derived from this data must NEVER be claimed as representing real-world physical accuracy
or empirical ground truth in medical, banking, or civic facilities.
"""

import os
import numpy as np
import pandas as pd

def generate_synthetic_queue_data(n_samples: int = 5000, random_state: int = 42) -> pd.DataFrame:
    """
    Generate synthetic data with 8 input features:
    1. queue_length: Current count of waiting patrons (0-60)
    2. active_counters: Number of operating desks (1-8)
    3. avg_service_time: Average service duration per person in minutes (3.0-18.0)
    4. hour: Hour of day (8-20 for typical facility operations)
    5. day_of_week: Day of week (0=Mon, 6=Sun)
    6. historical_queue: Rolling historical average queue length for this hour/day (2-50)
    7. crowd_reports: Consensus community crowd report score (1=Low, 2=Moderate, 3=High, 4=Critical)
    8. completion_rate: Recent throughput rate (customers completed per counter per hour, 3.0-15.0)
    
    Target:
    wait_time_minutes: Total estimated queue wait time before service begins.
    """
    np.random.seed(random_state)

    # 1. queue_length: 0 to 55 patrons
    queue_length = np.random.randint(0, 56, size=n_samples)

    # 2. active_counters: 1 to 8 service desks
    active_counters = np.random.randint(1, 9, size=n_samples)

    # 3. avg_service_time: 3.5 to 16.0 minutes per patron
    avg_service_time = np.random.uniform(3.5, 16.0, size=n_samples)

    # 4. hour: 8:00 AM to 8:00 PM (8 to 20)
    hour = np.random.randint(8, 21, size=n_samples)

    # 5. day_of_week: 0 (Mon) to 6 (Sun)
    day_of_week = np.random.randint(0, 7, size=n_samples)

    # 6. historical_queue: baseline historical load with correlation to current queue
    historical_queue = np.clip(
        queue_length * 0.7 + np.random.normal(5.0, 4.0, size=n_samples),
        1.0,
        50.0
    )

    # 7. crowd_reports: 1.0 (Low), 2.0 (Moderate), 3.0 (High), 4.0 (Critical) with noise
    crowd_reports = np.clip(
        np.round(1.0 + (queue_length / 15.0) + np.random.normal(0, 0.3, size=n_samples)),
        1.0,
        4.0
    )

    # 8. completion_rate: patrons processed per counter per hour (inverse of avg_service_time * efficiency)
    efficiency = np.random.uniform(0.85, 1.15, size=n_samples)
    completion_rate = np.clip(
        (60.0 / avg_service_time) * efficiency,
        2.5,
        18.0
    )

    # -------------------------------------------------------------
    # Queuing Theory Target Simulation:
    # Baseline Wait = (queue_length / (active_counters * (completion_rate / 60.0)))
    # -------------------------------------------------------------
    hourly_capacity = active_counters * completion_rate  # total patrons/hour
    minute_capacity = hourly_capacity / 60.0             # patrons/minute

    # Base wait time in minutes
    base_wait_minutes = np.where(
        queue_length == 0,
        0.0,
        queue_length / minute_capacity
    )

    # Peak hour multiplier (lunch rush 11:00-14:00, evening intake 16:30-18:30)
    peak_multiplier = np.ones(n_samples)
    peak_multiplier = np.where((hour >= 11) & (hour <= 14), 1.22, peak_multiplier)
    peak_multiplier = np.where((hour >= 17) & (hour <= 19), 1.18, peak_multiplier)

    # Day of week multiplier (Mondays and Fridays have higher administrative overhead)
    day_multiplier = np.ones(n_samples)
    day_multiplier = np.where(day_of_week == 0, 1.12, day_multiplier)  # Monday surge
    day_multiplier = np.where(day_of_week == 4, 1.08, day_multiplier)  # Friday rush
    day_multiplier = np.where(day_of_week >= 5, 0.90, day_multiplier)  # Weekend modified hours

    # Crowd report surge effect (real-time reported congestion confirms friction)
    crowd_multiplier = 1.0 + 0.05 * (crowd_reports - 2.0)

    # Discrepancy between current queue and historical expectation adds slight friction
    historical_friction = 1.0 + 0.003 * np.maximum(0, queue_length - historical_queue)

    # Stochastic Gaussian noise (stochastic delays, document check anomalies)
    noise = np.random.normal(0.0, 1.2, size=n_samples)

    # Calculate final simulated wait time
    simulated_wait = (
        base_wait_minutes
        * peak_multiplier
        * day_multiplier
        * crowd_multiplier
        * historical_friction
    ) + noise

    # Ensure no negative wait times and handle zero queue
    wait_time_minutes = np.where(
        queue_length == 0,
        0.0,
        np.maximum(0.5, np.round(simulated_wait, 2))
    )

    df = pd.DataFrame({
        "queue_length": queue_length.astype(int),
        "active_counters": active_counters.astype(int),
        "avg_service_time": np.round(avg_service_time, 2),
        "hour": hour.astype(int),
        "day_of_week": day_of_week.astype(int),
        "historical_queue": np.round(historical_queue, 2),
        "crowd_reports": np.round(crowd_reports, 1),
        "completion_rate": np.round(completion_rate, 2),
        "wait_time_minutes": np.round(wait_time_minutes, 2),
    })

    return df

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(out_dir, "queue_data.csv")
    df = generate_synthetic_queue_data(5000)
    df.to_csv(data_path, index=False)
    print(f"Generated {len(df)} synthetic queue samples at: {data_path}")
    print("\nDataset Summary Statistics:")
    print(df.describe().round(2))

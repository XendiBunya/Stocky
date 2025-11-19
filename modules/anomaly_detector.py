"""
Anomaly Detection Module
Implements multiple anomaly detection algorithms for stock data
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from scipy import stats
from typing import List, Dict, Tuple


class AnomalyDetector:
    """Detects anomalies in stock data using multiple methods"""

    def __init__(self, method: str = 'z_score', **params):
        """
        Initialize anomaly detector

        Args:
            method: Detection method ('z_score', 'iqr', 'isolation_forest', 'bollinger', 'combined')
            **params: Method-specific parameters
        """
        self.method = method
        self.params = params
        self.anomalies = None

    def detect_anomalies(self, df: pd.DataFrame, features: List[str]) -> pd.DataFrame:
        """
        Detect anomalies in stock data

        Args:
            df: DataFrame with stock data
            features: List of features to analyze for anomalies

        Returns:
            DataFrame with anomaly flags and scores
        """
        df = df.copy()

        if self.method == 'z_score':
            df = self._z_score_detection(df, features)
        elif self.method == 'iqr':
            df = self._iqr_detection(df, features)
        elif self.method == 'isolation_forest':
            df = self._isolation_forest_detection(df, features)
        elif self.method == 'bollinger':
            df = self._bollinger_detection(df)
        elif self.method == 'combined':
            df = self._combined_detection(df, features)
        else:
            raise ValueError(f"Unknown method: {self.method}")

        return df

    def _z_score_detection(self, df: pd.DataFrame, features: List[str]) -> pd.DataFrame:
        """Detect anomalies using Z-score method"""
        threshold = self.params.get('z_threshold', 3.0)

        df['anomaly_score'] = 0
        df['is_anomaly'] = False
        df['anomaly_reasons'] = ''

        for feature in features:
            if feature not in df.columns:
                continue

            # Calculate Z-score
            mean = df[feature].mean()
            std = df[feature].std()

            if std == 0:
                continue

            z_scores = np.abs((df[feature] - mean) / std)
            feature_anomalies = z_scores > threshold

            # Update anomaly score (max z-score across features)
            df['anomaly_score'] = df['anomaly_score'].combine(z_scores, max)

            # Mark anomalies and add reasons
            mask = feature_anomalies
            df.loc[mask, 'is_anomaly'] = True
            df.loc[mask, 'anomaly_reasons'] += f"{feature} (Z={z_scores[mask].values[0]:.2f}); "

        return df

    def _iqr_detection(self, df: pd.DataFrame, features: List[str]) -> pd.DataFrame:
        """Detect anomalies using Interquartile Range (IQR) method"""
        multiplier = self.params.get('iqr_multiplier', 1.5)

        df['anomaly_score'] = 0
        df['is_anomaly'] = False
        df['anomaly_reasons'] = ''

        for feature in features:
            if feature not in df.columns:
                continue

            Q1 = df[feature].quantile(0.25)
            Q3 = df[feature].quantile(0.75)
            IQR = Q3 - Q1

            lower_bound = Q1 - multiplier * IQR
            upper_bound = Q3 + multiplier * IQR

            # Calculate how far outside bounds (normalized)
            below_lower = (lower_bound - df[feature]).clip(lower=0) / (IQR if IQR > 0 else 1)
            above_upper = (df[feature] - upper_bound).clip(lower=0) / (IQR if IQR > 0 else 1)
            deviation = below_lower + above_upper

            feature_anomalies = (df[feature] < lower_bound) | (df[feature] > upper_bound)

            # Update anomaly score
            df['anomaly_score'] = df['anomaly_score'].combine(deviation, max)

            # Mark anomalies and add reasons
            mask = feature_anomalies
            df.loc[mask, 'is_anomaly'] = True
            df.loc[mask, 'anomaly_reasons'] += f"{feature} (IQR outlier); "

        return df

    def _isolation_forest_detection(self, df: pd.DataFrame, features: List[str]) -> pd.DataFrame:
        """Detect anomalies using Isolation Forest"""
        contamination = self.params.get('contamination', 0.1)
        n_estimators = self.params.get('n_estimators', 100)

        # Prepare features
        valid_features = [f for f in features if f in df.columns]
        if not valid_features:
            df['anomaly_score'] = 0
            df['is_anomaly'] = False
            df['anomaly_reasons'] = ''
            return df

        # Remove NaN values for training
        df_clean = df[valid_features].dropna()

        if len(df_clean) < 10:
            df['anomaly_score'] = 0
            df['is_anomaly'] = False
            df['anomaly_reasons'] = ''
            return df

        # Standardize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(df_clean)

        # Train Isolation Forest
        iso_forest = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            random_state=42
        )
        predictions = iso_forest.fit_predict(X_scaled)
        scores = iso_forest.score_samples(X_scaled)

        # Map back to original dataframe
        df['anomaly_score'] = 0.0
        df['is_anomaly'] = False
        df['anomaly_reasons'] = ''

        df.loc[df_clean.index, 'anomaly_score'] = -scores  # Invert so higher = more anomalous
        df.loc[df_clean.index, 'is_anomaly'] = predictions == -1
        df.loc[df.loc[df_clean.index, 'is_anomaly'].index, 'anomaly_reasons'] = 'Isolation Forest detection; '

        return df

    def _bollinger_detection(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect anomalies using Bollinger Bands"""
        df['anomaly_score'] = 0
        df['is_anomaly'] = False
        df['anomaly_reasons'] = ''

        if 'BB_Upper' in df.columns and 'BB_Lower' in df.columns:
            # Detect breaches
            upper_breach = df['Close'] > df['BB_Upper']
            lower_breach = df['Close'] < df['BB_Lower']

            # Calculate distance from bands (normalized)
            bb_range = df['BB_Upper'] - df['BB_Lower']
            upper_distance = ((df['Close'] - df['BB_Upper']) / bb_range).clip(lower=0)
            lower_distance = ((df['BB_Lower'] - df['Close']) / bb_range).clip(lower=0)

            df['anomaly_score'] = upper_distance + lower_distance

            df.loc[upper_breach, 'is_anomaly'] = True
            df.loc[upper_breach, 'anomaly_reasons'] += 'Above Bollinger Upper Band; '

            df.loc[lower_breach, 'is_anomaly'] = True
            df.loc[lower_breach, 'anomaly_reasons'] += 'Below Bollinger Lower Band; '

        return df

    def _combined_detection(self, df: pd.DataFrame, features: List[str]) -> pd.DataFrame:
        """Combine multiple detection methods"""
        voting_threshold = self.params.get('voting_threshold', 2)

        # Run multiple methods
        df_zscore = self._z_score_detection(df.copy(), features)
        df_iqr = self._iqr_detection(df.copy(), features)
        df_bollinger = self._bollinger_detection(df.copy())

        # Voting mechanism
        votes = (
            df_zscore['is_anomaly'].astype(int) +
            df_iqr['is_anomaly'].astype(int) +
            df_bollinger['is_anomaly'].astype(int)
        )

        df['is_anomaly'] = votes >= voting_threshold
        df['anomaly_score'] = (
            df_zscore['anomaly_score'] +
            df_iqr['anomaly_score'] +
            df_bollinger['anomaly_score']
        ) / 3

        # Combine reasons
        df['anomaly_reasons'] = ''
        for idx in df[df['is_anomaly']].index:
            reasons = []
            if df_zscore.loc[idx, 'is_anomaly']:
                reasons.append('Z-score')
            if df_iqr.loc[idx, 'is_anomaly']:
                reasons.append('IQR')
            if df_bollinger.loc[idx, 'is_anomaly']:
                reasons.append('Bollinger')
            df.loc[idx, 'anomaly_reasons'] = ', '.join(reasons)

        return df

    def get_anomaly_summary(self, df: pd.DataFrame) -> Dict:
        """Get summary statistics of detected anomalies"""
        anomalies = df[df['is_anomaly']]

        return {
            'total_anomalies': len(anomalies),
            'anomaly_rate': len(anomalies) / len(df) * 100 if len(df) > 0 else 0,
            'avg_anomaly_score': anomalies['anomaly_score'].mean() if len(anomalies) > 0 else 0,
            'max_anomaly_score': anomalies['anomaly_score'].max() if len(anomalies) > 0 else 0,
            'anomaly_dates': anomalies.index.tolist()
        }

    def get_top_anomalies(self, df: pd.DataFrame, n: int = 10) -> pd.DataFrame:
        """Get top N anomalies by score"""
        anomalies = df[df['is_anomaly']].copy()

        if len(anomalies) == 0:
            return pd.DataFrame()

        anomalies = anomalies.sort_values('anomaly_score', ascending=False)
        return anomalies.head(n)

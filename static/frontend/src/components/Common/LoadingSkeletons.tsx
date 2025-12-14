import React from 'react'
import styled, { keyframes } from 'styled-components'

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

const SkeletonBase = styled.div`
  background: linear-gradient(
    90deg,
    ${({ theme }) => (theme as any).colors.bgCard} 25%,
    ${({ theme }) => (theme as any).colors.border}44 50%,
    ${({ theme }) => (theme as any).colors.bgCard} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border-radius: 4px;
`

const SkeletonText = styled(SkeletonBase) <{ $width?: string; $height?: string }>`
  width: ${({ $width }) => $width || '100%'};
  height: ${({ $height }) => $height || '14px'};
  margin-bottom: 8px;
`

const SkeletonCircle = styled(SkeletonBase) <{ $size?: string }>`
  width: ${({ $size }) => $size || '40px'};
  height: ${({ $size }) => $size || '40px'};
  border-radius: 50%;
`

const SkeletonCard = styled.div`
  background: ${({ theme }) => (theme as any).colors.bgCard};
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
  border-radius: ${({ theme }) => (theme as any).borderRadius.md};
  padding: 16px;
  margin-bottom: 16px;
`

const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  
  &:last-child { margin-bottom: 0; }
`

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
`

// Telemetry Panel Skeleton
export function TelemetryDeckSkeleton() {
    return (
        <SkeletonCard>
            <SkeletonRow>
                <SkeletonText $width="120px" $height="20px" />
                <SkeletonText $width="60px" $height="16px" />
            </SkeletonRow>
            <SkeletonText $width="60px" $height="48px" />
            <SkeletonText $width="100%" $height="8px" />
            <SkeletonText $width="80px" $height="12px" />
            <SkeletonGrid>
                <SkeletonText $height="60px" />
                <SkeletonText $height="60px" />
                <SkeletonText $height="60px" />
            </SkeletonGrid>
        </SkeletonCard>
    )
}

// Track Map / Circuit Skeleton
export function TrackMapSkeleton() {
    return (
        <SkeletonCard style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <SkeletonRow>
                <SkeletonText $width="100px" $height="18px" />
                <SkeletonText $width="80px" $height="16px" />
            </SkeletonRow>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 0' }}>
                {[1, 2, 3, 4].map(i => (
                    <SkeletonRow key={i}>
                        <SkeletonText $width="80px" $height="12px" />
                        <SkeletonText $width="100%" $height="40px" style={{ borderRadius: 20 }} />
                    </SkeletonRow>
                ))}
            </div>
            <SkeletonRow style={{ justifyContent: 'space-around' }}>
                <SkeletonText $width="50px" $height="36px" />
                <SkeletonText $width="50px" $height="36px" />
                <SkeletonText $width="50px" $height="36px" />
                <SkeletonText $width="50px" $height="36px" />
            </SkeletonRow>
        </SkeletonCard>
    )
}

// Pit Wall Engineer Skeleton
export function PitWallEngineerSkeleton() {
    return (
        <SkeletonCard style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <SkeletonRow>
                <SkeletonText $width="180px" $height="18px" />
                <div style={{ marginLeft: 'auto' }}>
                    <SkeletonText $width="40px" $height="20px" />
                </div>
            </SkeletonRow>
            <div style={{ flex: 1, minHeight: 200, marginTop: 12 }}>
                {[1, 2, 3].map(i => (
                    <SkeletonRow key={i}>
                        <SkeletonCircle $size="32px" />
                        <SkeletonText $width="80%" $height="32px" />
                    </SkeletonRow>
                ))}
            </div>
            <SkeletonText $width="100%" $height="48px" style={{ marginTop: 12 }} />
            <SkeletonRow style={{ marginTop: 12 }}>
                <SkeletonText $width="100%" $height="36px" />
                <SkeletonText $width="40px" $height="36px" />
            </SkeletonRow>
        </SkeletonCard>
    )
}

// Sprint Health Gauge Skeleton
export function SprintHealthSkeleton() {
    return (
        <SkeletonCard>
            <SkeletonRow>
                <SkeletonText $width="140px" $height="16px" />
            </SkeletonRow>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                <SkeletonCircle $size="80px" />
                <div style={{ flex: 1 }}>
                    <SkeletonText $width="60px" $height="24px" />
                    <SkeletonText $width="100px" $height="12px" />
                </div>
            </div>
        </SkeletonCard>
    )
}

// Predictive Alerts Skeleton
export function PredictiveAlertsSkeleton() {
    return (
        <SkeletonCard>
            <SkeletonRow>
                <SkeletonText $width="160px" $height="16px" />
            </SkeletonRow>
            {[1, 2].map(i => (
                <SkeletonRow key={i} style={{ marginTop: 12 }}>
                    <SkeletonCircle $size="24px" />
                    <div style={{ flex: 1 }}>
                        <SkeletonText $width="80%" $height="14px" />
                        <SkeletonText $width="50%" $height="10px" />
                    </div>
                </SkeletonRow>
            ))}
        </SkeletonCard>
    )
}

// Generic Loading Spinner
const SpinnerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${({ theme }) => (theme as any).colors.border};
  border-top-color: ${({ theme }) => (theme as any).colors.purpleSector};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

export function LoadingSpinner({ size = 32 }: { size?: number }) {
    return (
        <SpinnerContainer>
            <Spinner style={{ width: size, height: size }} />
        </SpinnerContainer>
    )
}

// Full Dashboard Skeleton
export function DashboardSkeleton() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 400px', gap: 12, padding: 12, height: 'calc(100vh - 73px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <TelemetryDeckSkeleton />
                <SprintHealthSkeleton />
                <PredictiveAlertsSkeleton />
            </div>
            <TrackMapSkeleton />
            <PitWallEngineerSkeleton />
        </div>
    )
}

export default {
    TelemetryDeckSkeleton,
    TrackMapSkeleton,
    PitWallEngineerSkeleton,
    SprintHealthSkeleton,
    PredictiveAlertsSkeleton,
    LoadingSpinner,
    DashboardSkeleton
}

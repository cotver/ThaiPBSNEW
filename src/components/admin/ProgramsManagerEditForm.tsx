'use client'

import React from 'react'
import { ProgramsManagerAddForm, type AwardOption, type EditInitialData } from './ProgramsManagerAddForm'

type Props = {
  programId: number
  initialData: EditInitialData
  /** Field labels from payload.config (programs collection); when provided, form labels match default page */
  programFieldLabels?: Record<string, string>
  awardOptions?: AwardOption[]
}

export function ProgramsManagerEditForm({ programId, initialData, programFieldLabels, awardOptions }: Props) {
  return (
    <ProgramsManagerAddForm
      programDbId={programId}
      initialData={initialData}
      programFieldLabels={programFieldLabels}
      awardOptions={awardOptions}
    />
  )
}

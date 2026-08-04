interface ListLevel {
    name: string,
    level_id: number,
    position: number,
    publisher?: string,
    verifier?: string
}

// AREDL

interface AREDLLevel {
    name: string
    position: number
    level_id: number,
    publisher_id: string
}

interface AREDLVerification {
    submitted_by: {
        name: string
    }
}

interface AREDLLevelExpanded {
    publisher: {
        username: string
    },
    verifications: AREDLVerification[]
}
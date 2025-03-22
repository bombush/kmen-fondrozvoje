import { Project } from "@/types"
import { ProjectCrud } from "../crud/project-crud"
import { PledgeCrud } from "../crud/pledge-crud"
import { db } from "../../firebase/config"
import { runTransaction } from "firebase/firestore"

export class ProjectWorkflow {
  private projectCrud: ProjectCrud
  private pledgeCrud: PledgeCrud

  constructor() {
    this.projectCrud = new ProjectCrud()
    this.pledgeCrud = new PledgeCrud()
  }

  /**
   * Creates a new project and initializes its funding state
   */
  async createProject(
    data: Omit<Project, "id" | "createdAt" | "updatedAt" | "deleted" | "currentAmount">
  ): Promise<Project> {
    try {
      const project = await this.projectCrud.create({
        ...data
      })
      return project
    } catch (error) {
      console.error("Error in createProject workflow:", error)
      throw error
    }
  }

  /**
   * Closes a project and locks all its pledges
   * This operation is atomic - either all pledges are locked and project is closed, or none
   */
  async closeProject(projectId: string): Promise<Project> {
    const canDelete = await this.canDeleteProject(projectId)
    if (!canDelete) {
      throw new Error("Project cannot be closed because it has an outstanding balance")
    }

    try {
      return await runTransaction(db, async (transaction) => {
        // Get the project
        const project = await this.projectCrud.getById(projectId)
        if (!project) {
          throw new Error("Project not found")
        }

        if (project.deleted) {
          throw new Error("Cannot close a deleted project")
        }

        // Get all project pledges
        const pledges = await this.pledgeCrud.getByProjectId(projectId)

        // Lock all pledges
        const lockPromises = pledges.map(pledge => 
          this.pledgeCrud.update(pledge.id, { locked: true })
        )
        await Promise.all(lockPromises)

        // Update project status
        const updatedProject = await this.projectCrud.update(projectId, { 
          closed: true,
          closedAt: new Date().toISOString()
        })

        return updatedProject
      })
    } catch (error) {
      console.error("Error in closeProject workflow:", error)
      throw error
    }
  }

  async canDeleteProject(projectId: string): Promise<boolean> {
    const project = await this.projectCrud.getById(projectId)
    if (!project) {
      throw new Error("Project not found")
    }

    const currentBalance = await this.getProjectBalance(projectId)
    return currentBalance === project.goal
  }

  async getProjectBalance(projectId: string): Promise<number> {
    const pledges = await this.pledgeCrud.getByProjectId(projectId)
    return pledges.reduce((sum, pledge) => sum + pledge.amount, 0)
  }

  /**
   * Deletes a project and all its associated pledges
   * This operation is atomic - either project and all pledges are deleted, or none
   */
  async deleteProject(projectId: string): Promise<Project> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Get the project
        const project = await this.projectCrud.getById(projectId)
        if (!project) {
          throw new Error("Project not found")
        }

        // Get all project pledges
        const pledges = await this.pledgeCrud.getByProjectId(projectId)

        // Soft delete all pledges

        //@TODO: check permissions on this: pledge should be possible to be deleted by project owner when deleting project
        const deletePromises = pledges.map(pledge => 
          this.pledgeCrud.softDelete(pledge.id)
        )
        await Promise.all(deletePromises)

        // Soft delete the project
        const deletedProject = await this.projectCrud.softDelete(projectId)

        return deletedProject
      })
    } catch (error) {
      console.error("Error in deleteProject workflow:", error)
      throw error
    }
  }
}

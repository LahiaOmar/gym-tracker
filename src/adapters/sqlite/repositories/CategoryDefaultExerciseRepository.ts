import type { SQLiteDatabase } from 'expo-sqlite';
import type { CategoryDefaultExercise } from '@/src/domain';
import type { CategoryDefaultExerciseRepository as IRepo, ListOptions } from '@/src/domain';
import { generateId } from '../helpers';

type Row = {
  id: string;
  category_id: string;
  exercise_id: string;
  order: number;
};

function rowToEntity(r: Row): CategoryDefaultExercise {
  return {
    id: r.id,
    categoryId: r.category_id,
    exerciseId: r.exercise_id,
    order: r.order,
  };
}

export function createCategoryDefaultExerciseRepository(db: SQLiteDatabase): IRepo {
  return {
    async create(entity) {
      const id = entity.id ?? generateId();
      await db.runAsync(
        'INSERT INTO category_default_exercise (id, category_id, exercise_id, "order") VALUES (?, ?, ?, ?)',
        id,
        entity.categoryId,
        entity.exerciseId,
        entity.order
      );
      return { ...entity, id };
    },

    async delete(id) {
      await db.runAsync('DELETE FROM category_default_exercise WHERE id = ?', id);
    },

    async deleteByCategory(categoryId) {
      await db.runAsync('DELETE FROM category_default_exercise WHERE category_id = ?', categoryId);
    },

    async list(options) {
      const categoryId = options?.filter?.categoryId;
      if (!categoryId) return [];
      const limit = options?.limit ?? 100;
      const offset = options?.offset ?? 0;
      const rows = await db.getAllAsync<Row>(
        'SELECT * FROM category_default_exercise WHERE category_id = ? ORDER BY "order" ASC LIMIT ? OFFSET ?',
        categoryId,
        limit,
        offset
      );
      return rows.map(rowToEntity);
    },

    async bulkCreate(entities) {
      const results: CategoryDefaultExercise[] = [];
      for (const entity of entities) {
        const created = await this.create(entity);
        results.push(created);
      }
      return results;
    },
  };
}

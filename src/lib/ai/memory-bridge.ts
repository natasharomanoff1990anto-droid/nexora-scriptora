import { supabase } from "../supabase";

export const saveChapterMemory = async (projectId: string, index: number, content: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('store-book-memory', {
      body: { projectId, chapterIndex: index, content }
    });
    return { data, error };
  } catch (err) {
    console.error("Memory Storage Failed:", err);
  }
};

export const recallContext = async (projectId: string, query: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('retrieve-book-memory', {
      body: { projectId, queryContent: query, limit: 3 }
    });
    return data?.memories || [];
  } catch (err) {
    console.error("Memory Retrieval Failed:", err);
    return [];
  }
};

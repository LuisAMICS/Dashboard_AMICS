import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private authService = inject(AuthService);
    private get supabase(): SupabaseClient {
        return this.authService.supabase;
    }


    // --- Dashboard Methods ---
    async getActiveProjects() {
        const { data, error } = await this.supabase
            .from('projects')
            .select(`id, name, status, clients(company_name)`)
            .in('status', ['briefing', 'planning', 'in_progress', 'review'])
            .limit(4);

        if (error) throw error;
        return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            client: p.clients?.company_name || 'Desconocido',
            progress: p.status === 'in_progress' ? 50 : p.status === 'review' ? 80 : 20
        }));
    }

    async getTodayTasks() {
        const { data, error } = await this.supabase
            .from('tasks')
            .select(`id, title, due_date, projects(name)`)
            .eq('status', 'today')
            .limit(5);

        if (error) throw error;
        return data.map((t: any) => ({
            id: t.id,
            title: t.title,
            project: t.projects?.name || 'Varios',
            time: t.due_date ? new Date(t.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Todo el día'
        }));
    }

    async getUpcomingMeetings() {
        const { data, error } = await this.supabase
            .from('meetings')
            .select('*')
            .gte('start_at', new Date().toISOString())
            .order('start_at', { ascending: true })
            .limit(3);

        if (error) throw error;
        return data.map((m: any) => ({
            id: m.id,
            title: m.title,
            month: new Date(m.start_at).toLocaleDateString('es-ES', { month: 'short' }),
            day: new Date(m.start_at).getDate().toString().padStart(2, '0'),
            time: `${new Date(m.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(m.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            avatars: ['https://i.pravatar.cc/150?u=' + m.id]
        }));
    }

    async getRecentActivity() {
        const { data, error } = await this.supabase
            .from('activity_log')
            .select(`id, action, created_at, profiles(full_name)`)
            .order('created_at', { ascending: false })
            .limit(4);

        if (error) throw error;
        return data.map((a: any) => ({
            id: a.id,
            user: a.profiles?.full_name || 'Alguien',
            action: a.action,
            target: '',
            time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            colorClass: 'bg-blue-400'
        }));
    }

    // --- CRM / Leads ---
    async getLeads() {
        const { data, error } = await this.supabase.from('leads').select('*, profiles(full_name, avatar_url)');
        if (error) throw error;
        return data;
    }

    async createLead(lead: any) {
        const { data, error } = await this.supabase.from('leads').insert([lead]).select();
        if (error) throw error;
        return data[0];
    }

    async updateLead(id: string, updates: any) {
        const { data, error } = await this.supabase
            .from('leads')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    }

    async updateProfile(id: string, updates: any) {
        const { data, error } = await this.supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
        return data ? data[0] : null;
    }

    async getMyProfile() {
        const { data: { user }, error: authError } = await this.supabase.auth.getUser();

        if (authError || !user) {
            console.warn('No active session found');
            return null;
        }

        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }

        // If profile doesn't exist yet, create a basic one
        if (!data) {
            const newProfile = {
                id: user.id,
                full_name: user.email?.split('@')[0] || 'Nuevo Usuario',
                role: 'Miembro',
                timezone: 'Europe/Madrid'
            };
            const { data: created, error: createError } = await this.supabase
                .from('profiles')
                .insert([newProfile])
                .select()
                .single();

            if (createError) throw createError;
            return created;
        }

        return data;
    }

    async uploadAvatar(file: File, userId: string) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await this.supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = this.supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return publicUrl;
    }

    async deleteLead(id: string) {
        const { error } = await this.supabase.from('leads').delete().eq('id', id);
        if (error) throw error;
    }

    // --- Clients ---
    async getClients() {
        const { data, error } = await this.supabase.from('clients').select('*, profiles(full_name, avatar_url)');
        if (error) throw error;
        return data;
    }

    async createClient(client: any) {
        const { data, error } = await this.supabase.from('clients').insert([client]).select();
        if (error) throw error;
        return data[0];
    }

    async updateClient(id: string, updates: any) {
        const { data, error } = await this.supabase.from('clients').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    }

    async deleteClient(id: string) {
        const { error } = await this.supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
    }

    // --- Projects ---
    async getProjects() {
        const { data, error } = await this.supabase.from('projects').select('*, clients(company_name)');
        if (error) throw error;
        return data;
    }

    async createProject(project: any) {
        const { data, error } = await this.supabase.from('projects').insert([project]).select();
        if (error) throw error;
        return data[0];
    }

    async updateProject(id: string, updates: any) {
        const { data, error } = await this.supabase.from('projects').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    }

    async deleteProject(id: string) {
        const { error } = await this.supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
    }

    // --- Tasks ---
    async getTasks() {
        const { data, error } = await this.supabase.from('tasks').select('*, projects(name), profiles(full_name, avatar_url)');
        if (error) throw error;
        return data;
    }

    async createTask(task: any) {
        const { data, error } = await this.supabase.from('tasks').insert([task]).select();
        if (error) throw error;
        return data[0];
    }

    async updateTask(id: string, updates: any) {
        const { data, error } = await this.supabase.from('tasks').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    }

    async deleteTask(id: string) {
        const { error } = await this.supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
    }

    // --- Profiles ---
    async getProfiles() {
        const { data, error } = await this.supabase.from('profiles').select('id, full_name, avatar_url, role');
        if (error) throw error;
        return data;
    }

    // --- Documents & Google Drive ---
    async getDocuments() {
        const { data, error } = await this.supabase
            .from('documents')
            .select('*, projects(name), profiles:uploader_id(full_name, avatar_url)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    async uploadToGoogleDrive(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);

        const { data, error } = await this.supabase.functions.invoke('google-drive-sync', {
            body: formData,
        });

        if (error) throw error;
        return data;
    }

    async uploadDocument(file: File, projectId?: string, clientId?: string) {
        try {
            // 1. Sync to Google Drive
            const driveFile = await this.uploadToGoogleDrive(file);

            // 2. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `docs/${fileName}`;

            const { error: uploadError } = await this.supabase.storage
                .from('documents')
                .upload(filePath, file);
            if (uploadError) throw uploadError;

            // 3. Database Entry
            const { data, error } = await this.supabase.from('documents').insert([{
                name: file.name,
                size: file.size,
                mime_type: file.type || 'application/octet-stream',
                storage_path: filePath,
                drive_file_id: driveFile.fileId,
                project_id: projectId || null,
                client_id: clientId || null
            }]).select();

            if (error) throw error;
            await this.logActivity('subió un documento', 'document', data[0].id, { fileName: file.name });
            return data[0];
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    }

    async deleteDocument(id: string, storagePath: string | null) {
        if (storagePath) {
            await this.supabase.storage.from('documents').remove([storagePath]);
        }
        const { error } = await this.supabase.from('documents').delete().eq('id', id);
        if (error) throw error;
    }

    // --- Meetings ---
    async getMeetings() {
        const { data, error } = await this.supabase.from('meetings').select('*, projects(name)').order('start_at', { ascending: true });
        if (error) throw error;
        return data;
    }

    async createMeeting(meeting: any) {
        const { data, error } = await this.supabase.from('meetings').insert([meeting]).select();
        if (error) throw error;
        return data[0];
    }

    async updateMeeting(id: string, meeting: any) {
        const { data, error } = await this.supabase.from('meetings').update(meeting).eq('id', id).select();
        if (error) throw error;
        return data[0];
    }

    async deleteMeeting(id: string) {
        const { error } = await this.supabase.from('meetings').delete().eq('id', id);
        if (error) throw error;
    }

    // --- Activity & Reports ---
    async getActivityLogs() {
        const { data, error } = await this.supabase
            .from('activity_log')
            .select('*, profiles:user_id(full_name, avatar_url)')
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) throw error;
        return data;
    }

    async logActivity(action: string, entity_type: string, entity_id?: string, details?: any) {
        const { data: { user } } = await this.supabase.auth.getUser();

        const { error } = await this.supabase
            .from('activity_log')
            .insert([{
                user_id: user?.id || '11111111-1111-1111-1111-111111111111', // Fallback for dev if no user
                action,
                entity_type,
                entity_id,
                details
            }]);
        if (error) console.error('Error logging activity:', error);
    }

    async getReportStats() {
        const [leads, projects, tasks] = await Promise.all([
            this.supabase.from('leads').select('estimated_value, status, priority'),
            this.supabase.from('projects').select('id, budget, status, name'),
            this.supabase.from('tasks').select('status')
        ]);
        if (leads.error) throw leads.error;
        if (projects.error) throw projects.error;
        if (tasks.error) throw tasks.error;

        return {
            leads: leads.data,
            projects: projects.data,
            tasks: tasks.data
        };
    }
}

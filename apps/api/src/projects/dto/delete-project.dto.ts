import { IsString } from 'class-validator';

// DELETE /projects/:slug — the caller must type the project's name back, so a
// stray request (or a script) can't destroy a project by accident. Checked on
// the server too: the popup in the web app is a courtesy, not the safeguard.
export class DeleteProjectDto {
  @IsString()
  confirm_name!: string;
}

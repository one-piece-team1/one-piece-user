import { Logger } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Repository } from 'typeorm';
import { Post } from './post.entity';

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger: Logger = new Logger('PostRepository');

  public createPost(postReq: Post): void {
    this.repoManager.save(Post, postReq).catch((err) => this.logger.log(err.message, 'CreatePost'));
  }
}

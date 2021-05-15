import { Logger } from '@nestjs/common';
import { getRepository, EntityRepository, Repository } from 'typeorm';
import { Post } from './post.entity';
import { config } from '../../config';

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  private readonly connectionName: string = config.ENV === 'test' ? 'testConnection' : 'default';
  private readonly logger: Logger = new Logger('PostRepository');

  public createPost(postReq: Post): void {
    getRepository(Post, this.connectionName)
      .save(postReq)
      .catch((err) => this.logger.log(err.message, 'CreatePost'));
  }
}

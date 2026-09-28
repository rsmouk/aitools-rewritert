<?php
/**
 * Plugin Name: AI Writer Connector
 * Description: Connects the AI Article Writer app to this WordPress site.
 * Version: 1.0.0
 * Author: AI Writer
 */

if (!defined('ABSPATH')) {
    exit;
}

const AI_WRITER_OPTION = 'ai_writer_api_key';

register_activation_hook(__FILE__, 'ai_writer_activate');

function ai_writer_activate() {
    if (!get_option(AI_WRITER_OPTION)) {
        update_option(AI_WRITER_OPTION, bin2hex(random_bytes(32)));
    }
}

add_action('admin_menu', 'ai_writer_admin_menu');
add_action('rest_api_init', 'ai_writer_register_routes');

function ai_writer_admin_menu() {
    add_options_page(
        'AI Writer Connector',
        'AI Writer Connector',
        'manage_options',
        'ai-writer-connector',
        'ai_writer_settings_page'
    );
}

function ai_writer_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }

    if (isset($_POST['ai_writer_regenerate']) && check_admin_referer('ai_writer_regenerate')) {
        update_option(AI_WRITER_OPTION, bin2hex(random_bytes(32)));
        echo '<div class="notice notice-success"><p>API key regenerated. Update it in the AI Writer app.</p></div>';
    }

    $key = (string) get_option(AI_WRITER_OPTION, '');
    if ($key === '') {
        $key = bin2hex(random_bytes(32));
        update_option(AI_WRITER_OPTION, $key);
    }
    ?>
    <div class="wrap">
        <h1>AI Writer Connector</h1>
        <p>Connection status: <strong>Active</strong></p>
        <p>Copy this key into the Next.js app under Admin → WordPress API Key.</p>
        <p>
            <input id="ai-writer-key" type="text" class="regular-text" readonly value="<?php echo esc_attr($key); ?>" />
            <button type="button" class="button" onclick="navigator.clipboard.writeText(document.getElementById('ai-writer-key').value)">Copy</button>
        </p>
        <form method="post">
            <?php wp_nonce_field('ai_writer_regenerate'); ?>
            <p>
                <button type="submit" name="ai_writer_regenerate" value="1" class="button button-secondary">Regenerate Key</button>
            </p>
        </form>
        <p>REST base: <code><?php echo esc_html(rest_url('ai-writer/v1/')); ?></code></p>
    </div>
    <?php
}

function ai_writer_permission(WP_REST_Request $request) {
    $stored = (string) get_option(AI_WRITER_OPTION, '');
    $provided = (string) $request->get_header('x_ai_writer_key');
    if ($provided === '' && isset($_SERVER['HTTP_X_AI_WRITER_KEY'])) {
        $provided = sanitize_text_field(wp_unslash($_SERVER['HTTP_X_AI_WRITER_KEY']));
    }
    if ($stored === '' || $provided === '' || !hash_equals($stored, $provided)) {
        return new WP_Error('ai_writer_unauthorized', 'Invalid API key.', array('status' => 401));
    }
    return true;
}

function ai_writer_register_routes() {
    register_rest_route('ai-writer/v1', '/status', array(
        'methods' => 'GET',
        'callback' => 'ai_writer_status',
        'permission_callback' => 'ai_writer_permission',
    ));

    register_rest_route('ai-writer/v1', '/posts', array(
        array(
            'methods' => 'GET',
            'callback' => 'ai_writer_list_posts',
            'permission_callback' => 'ai_writer_permission',
        ),
        array(
            'methods' => 'POST',
            'callback' => 'ai_writer_create_post',
            'permission_callback' => 'ai_writer_permission',
        ),
    ));

    register_rest_route('ai-writer/v1', '/posts/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'ai_writer_get_post',
        'permission_callback' => 'ai_writer_permission',
    ));

    register_rest_route('ai-writer/v1', '/categories', array(
        array(
            'methods' => 'GET',
            'callback' => 'ai_writer_list_categories',
            'permission_callback' => 'ai_writer_permission',
        ),
        array(
            'methods' => 'POST',
            'callback' => 'ai_writer_create_category',
            'permission_callback' => 'ai_writer_permission',
        ),
    ));

    register_rest_route('ai-writer/v1', '/tags', array(
        array(
            'methods' => 'GET',
            'callback' => 'ai_writer_list_tags',
            'permission_callback' => 'ai_writer_permission',
        ),
        array(
            'methods' => 'POST',
            'callback' => 'ai_writer_create_tag',
            'permission_callback' => 'ai_writer_permission',
        ),
    ));
}

function ai_writer_status() {
    return rest_ensure_response(array(
        'ok' => true,
        'name' => 'AI Writer Connector',
    ));
}

function ai_writer_term_names($post_id, $taxonomy) {
    $terms = get_the_terms($post_id, $taxonomy);
    if (!is_array($terms)) {
        return array();
    }
    return array_values(array_map(function ($term) {
        return $term->name;
    }, $terms));
}

function ai_writer_format_post(WP_Post $post) {
    $excerpt = $post->post_excerpt !== '' ? $post->post_excerpt : wp_trim_words(wp_strip_all_tags($post->post_content), 40, '...');
    return array(
        'id' => (int) $post->ID,
        'title' => html_entity_decode(get_the_title($post), ENT_QUOTES, 'UTF-8'),
        'excerpt' => html_entity_decode(wp_strip_all_tags($excerpt), ENT_QUOTES, 'UTF-8'),
        'slug' => $post->post_name,
        'date' => get_post_time('c', true, $post),
        'categories' => ai_writer_term_names($post->ID, 'category'),
        'tags' => ai_writer_term_names($post->ID, 'post_tag'),
        'content' => $post->post_content,
        'status' => $post->post_status,
    );
}

function ai_writer_list_posts(WP_REST_Request $request) {
    $page = max(1, (int) $request->get_param('page'));
    $per_page = (int) $request->get_param('per_page');
    if ($per_page < 1) {
        $per_page = 10;
    }
    $per_page = min(20, $per_page);

    $query = new WP_Query(array(
        'post_type' => 'post',
        'post_status' => array('publish', 'draft', 'pending', 'future'),
        'posts_per_page' => $per_page,
        'paged' => $page,
        'orderby' => 'date',
        'order' => 'DESC',
    ));

    $posts = array();
    foreach ($query->posts as $post) {
        if ($post instanceof WP_Post) {
            $posts[] = ai_writer_format_post($post);
        }
    }

    return rest_ensure_response(array(
        'posts' => $posts,
        'total' => (int) $query->found_posts,
        'total_pages' => (int) $query->max_num_pages,
        'page' => $page,
    ));
}

function ai_writer_get_post(WP_REST_Request $request) {
    $post = get_post((int) $request['id']);
    if (!$post instanceof WP_Post || $post->post_type !== 'post') {
        return new WP_Error('ai_writer_not_found', 'Post not found.', array('status' => 404));
    }
    return rest_ensure_response(ai_writer_format_post($post));
}

function ai_writer_list_terms($taxonomy) {
    $terms = get_terms(array(
        'taxonomy' => $taxonomy,
        'hide_empty' => false,
    ));
    if (is_wp_error($terms)) {
        return $terms;
    }
    $items = array();
    foreach ($terms as $term) {
        $items[] = array(
            'id' => (int) $term->term_id,
            'name' => $term->name,
            'slug' => $term->slug,
            'count' => (int) $term->count,
        );
    }
    return rest_ensure_response($items);
}

function ai_writer_create_term(WP_REST_Request $request, $taxonomy) {
    $name = sanitize_text_field($request->get_param('name'));
    if ($name === '') {
        $body = $request->get_json_params();
        $name = sanitize_text_field(isset($body['name']) ? $body['name'] : '');
    }
    if ($name === '') {
        return new WP_Error('ai_writer_name', 'Name is required.', array('status' => 400));
    }

    $existing = get_term_by('name', $name, $taxonomy);
    if ($existing && !is_wp_error($existing)) {
        return rest_ensure_response(array(
            'id' => (int) $existing->term_id,
            'name' => $existing->name,
            'slug' => $existing->slug,
            'count' => (int) $existing->count,
        ));
    }

    $created = wp_insert_term($name, $taxonomy);
    if (is_wp_error($created)) {
        if ($created->get_error_code() === 'term_exists') {
            $error_data = $created->get_error_data();
            $existing_id = is_array($error_data) ? (int) reset($error_data) : (int) $error_data;
            $term = get_term($existing_id, $taxonomy);
            if ($term && !is_wp_error($term)) {
                return rest_ensure_response(array(
                    'id' => (int) $term->term_id,
                    'name' => $term->name,
                    'slug' => $term->slug,
                    'count' => (int) $term->count,
                ));
            }
        }
        return $created;
    }

    $term = get_term((int) $created['term_id'], $taxonomy);
    if (!$term || is_wp_error($term)) {
        return new WP_Error('ai_writer_term', 'Could not load the created term.', array('status' => 500));
    }
    return rest_ensure_response(array(
        'id' => (int) $term->term_id,
        'name' => $term->name,
        'slug' => $term->slug,
        'count' => (int) $term->count,
    ));
}

function ai_writer_list_categories() {
    return ai_writer_list_terms('category');
}

function ai_writer_create_category(WP_REST_Request $request) {
    return ai_writer_create_term($request, 'category');
}

function ai_writer_list_tags() {
    return ai_writer_list_terms('post_tag');
}

function ai_writer_create_tag(WP_REST_Request $request) {
    return ai_writer_create_term($request, 'post_tag');
}

function ai_writer_resolve_categories($names) {
    $ids = array();
    foreach ((array) $names as $name) {
        $name = sanitize_text_field($name);
        if ($name === '') {
            continue;
        }
        $existing = get_term_by('name', $name, 'category');
        if ($existing && !is_wp_error($existing)) {
            $ids[] = (int) $existing->term_id;
            continue;
        }
        $created = wp_insert_term($name, 'category');
        if (!is_wp_error($created)) {
            $ids[] = (int) $created['term_id'];
        } elseif ($created->get_error_code() === 'term_exists') {
            $error_data = $created->get_error_data();
            $ids[] = is_array($error_data) ? (int) reset($error_data) : (int) $error_data;
        }
    }
    return $ids;
}

function ai_writer_upload_image($post_id, $base64, $filename, $alt, $description) {
    if (strpos($base64, ',') !== false) {
        $parts = explode(',', $base64, 2);
        $base64 = $parts[1];
    }
    $binary = base64_decode($base64, true);
    if ($binary === false) {
        return new WP_Error('ai_writer_image', 'Featured image could not be decoded.', array('status' => 400));
    }
    if (strlen($binary) > 8 * 1024 * 1024) {
        return new WP_Error('ai_writer_image', 'Featured image must be 8 MB or smaller.', array('status' => 400));
    }

    $filename = sanitize_file_name(wp_basename($filename));
    if ($filename === '') {
        $filename = 'featured.jpg';
    }
    if (strpos($filename, '.') === false) {
        $filename .= '.jpg';
    }

    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $upload = wp_upload_bits($filename, null, $binary);
    if (!empty($upload['error'])) {
        return new WP_Error('ai_writer_image', $upload['error'], array('status' => 500));
    }

    $filetype = wp_check_filetype($filename);
    $attachment_id = wp_insert_attachment(array(
        'post_mime_type' => $filetype['type'] ? $filetype['type'] : 'image/jpeg',
        'post_title' => sanitize_text_field(pathinfo($filename, PATHINFO_FILENAME)),
        'post_content' => sanitize_textarea_field($description),
        'post_excerpt' => sanitize_text_field($alt),
        'post_status' => 'inherit',
    ), $upload['file'], $post_id);

    if (is_wp_error($attachment_id)) {
        return $attachment_id;
    }

    $metadata = wp_generate_attachment_metadata($attachment_id, $upload['file']);
    if (is_array($metadata)) {
        wp_update_attachment_metadata($attachment_id, $metadata);
    }
    update_post_meta($attachment_id, '_wp_attachment_image_alt', sanitize_text_field($alt));
    set_post_thumbnail($post_id, $attachment_id);
    return wp_get_attachment_url($attachment_id);
}

function ai_writer_create_post(WP_REST_Request $request) {
    $params = $request->get_json_params();
    if (!is_array($params)) {
        $params = array();
    }

    $title = sanitize_text_field(isset($params['title']) ? $params['title'] : '');
    if ($title === '') {
        return new WP_Error('ai_writer_title', 'Title is required.', array('status' => 400));
    }

    $status = (isset($params['status']) && $params['status'] === 'draft') ? 'draft' : 'publish';
    $post_id = wp_insert_post(array(
        'post_title' => $title,
        'post_content' => wp_kses_post(isset($params['content']) ? $params['content'] : ''),
        'post_excerpt' => sanitize_textarea_field(isset($params['description']) ? $params['description'] : ''),
        'post_name' => sanitize_title(isset($params['slug']) ? $params['slug'] : ''),
        'post_status' => $status,
        'post_type' => 'post',
    ), true);

    if (is_wp_error($post_id)) {
        return $post_id;
    }

    $category_ids = ai_writer_resolve_categories(isset($params['categories']) ? $params['categories'] : array());
    if ($category_ids) {
        wp_set_post_categories($post_id, $category_ids);
    }

    $tags = array();
    foreach ((array) (isset($params['tags']) ? $params['tags'] : array()) as $tag) {
        $tag = sanitize_text_field($tag);
        if ($tag !== '') {
            $tags[] = $tag;
        }
    }
    if ($tags) {
        wp_set_post_tags($post_id, $tags, false);
    }

    $image_url = '';
    $image_error = '';
    if (!empty($params['featured_image_base64'])) {
        $uploaded = ai_writer_upload_image(
            $post_id,
            $params['featured_image_base64'],
            isset($params['featured_image_filename']) ? $params['featured_image_filename'] : '',
            isset($params['featured_image_alt']) ? $params['featured_image_alt'] : $title,
            isset($params['featured_image_description']) ? $params['featured_image_description'] : $title
        );
        if (is_wp_error($uploaded)) {
            $image_error = $uploaded->get_error_message();
        } else {
            $image_url = $uploaded;
        }
    }

    return rest_ensure_response(array(
        'post_id' => (int) $post_id,
        'post_url' => get_permalink($post_id),
        'status' => get_post_status($post_id),
        'slug' => get_post_field('post_name', $post_id),
        'featured_image_url' => $image_url,
        'image_error' => $image_error,
    ));
}
